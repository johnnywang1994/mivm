import { h } from '../vdom';

function isComponent(vnode) {
  return vnode && typeof vnode.sel === 'function';
}

function parseProps(attrs) {
  const props = Object.create(null);
  for (let key in attrs) {
    if (key.startsWith('p_')) {
      props[key.slice(2)] = attrs[key];
      delete attrs[key];
    }
  }
  return props;
}

export const renderCx = { h, jsx: compiler };

export function compiler(tag, attrs) {
  let props = attrs || {};
  let children = [];
  let options = {
    attrs: {},
    on: {}
  };
  for (const key in props) {
    // event
    if (key.startsWith('on')) {
      options.on[key.slice(2).toLowerCase()] = props[key];
    } else {
      // normal
      options.attrs[key] = props[key];
    }
  }

  // children(component)
  for (let i = 2; i < arguments.length; i++) {
    let vnode = arguments[i];
    console.log(vnode);
    if (isComponent(vnode)) {
      let cx = {...renderCx}, attrs = {}, on = {};
      if (vnode.data) {
        attrs = vnode.data.attrs;
        on = vnode.data.on;
        // inject props
        cx.props = parseProps(attrs);
      }
      vnode = vnode.sel(cx);
      // handle attrs
      vnode.data.attrs = {...attrs, ...vnode.data.attrs};
      vnode.data.on = {...on, ...vnode.data.on};
    }
    children.push(vnode);
  }
  return h(tag, options, children);
}