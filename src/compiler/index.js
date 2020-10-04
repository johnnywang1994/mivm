import hash_sum from 'hash-sum';
import { h } from '../vdom';

// store node index
let parentIdxStack = [];

function isComponent(vnode) {
  return vnode && typeof vnode.sel === 'function';
}

function parseProps(attrs) {
  const props = Object.create(null);
  for (let key in attrs) {
    if (key.startsWith('p_')) {
      props[key.slice(2)] = attrs[key];
      delete attrs[key];
    } else if (key === 'key') {
      delete attrs[key];
    }
  }
  return props;
}

export const jsx = compiler;

export const renderCx = { h, jsx };

function compiler(tag, attrs) {
  let props = attrs || {};
  let children = [];
  let options = {
    attrs: {},
    on: {}
  };
  // mount root
  let isGreatRoot = typeof tag === 'string' && !parentIdxStack.length;
  // default rootKey
  let rootKey = isGreatRoot
    ? hash_sum(JSON.stringify(props))
    : undefined;

  // handle root
  for (const key in props) {
    // event
    if (key.startsWith('on')) {
      options.on[key.slice(2).toLowerCase()] = props[key];
    } else if (key === 'key') {
      rootKey = props[key];
    } else {
      // normal
      options.attrs[key] = props[key];
    }
  }

  const args = [...arguments].flat();
  parentIdxStack.push(rootKey);
  // has children
  for (let i = 2; i < args.length; i++) {
    let vnode = args[i];
    let key = vnode.key || i.toString();
    // set key
    if (vnode.data && vnode.data.attrs.key) {
      key = vnode.key = vnode.data.attrs.key;
    }
    parentIdxStack.push(key);
    // console.log(tag, parentIdxStack.filter(i => i).join('_'), vnode);

    // component
    if (isComponent(vnode)) {
      let cx = {...renderCx};
      let $children = []; // TODO: handle component slot
      let $attrs = {};
      let $on = {};
      const uniqueKey = parentIdxStack.filter(i => i).join('_');
      const componentCr = vnode.sel(uniqueKey);

      if (vnode.data) {
        $attrs = vnode.data.attrs;
        $on = vnode.data.on;
        // inject props
        cx.props = parseProps($attrs);
      }
      vnode = componentCr(cx);
      vnode.key = key;
      // handle attrs
      vnode.data.attrs = {...vnode.data.attrs, ...$attrs};
      vnode.data.on = {...vnode.data.on, ...$on};
    }

    children.push(vnode);
    parentIdxStack.pop();
  }
  parentIdxStack.pop();

  const root = h(tag, options, children);
  root.key = rootKey;
  return root;
}
