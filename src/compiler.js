import hash_sum from 'hash-sum';
import { h } from './vdom';

export const renderCx = { h };

// store node index
let parentIdxStack = [];

const _nbsp_ = ' ';
const _empty_ = '';
const _space_ = '|||';

function createTokenizer(list) {
  return function tokenize(raw, matched) {
    const [tagName] = matched.split(_nbsp_);
    list.push(tagName.replace('/', _empty_));
    return `${_space_}<${matched}>${_space_}`;
  };
}

function createAttrParser(token) {
  token.attrs = Object.create(null);
  return function attrParser(raw, attrName, binding) {
    // console.log(attrName, '|', binding);
    token.attrs[attrName] = binding;
    return raw;
  };
}

function createToken(value, tagNameList) {
  const startTagReg = /^\<\w+/;
  const endTagReg = /^\<\/\w+\>$/;
  const attrReg = /\s+['"]?([^=]+)['"]?=['"]+([^'"]+)['"]+/gi;
  const token = {
    type: 'Value',
    tagName: undefined,
    nodeType: undefined,
    attrs: undefined,
    value,
  };

  if (value.includes('<')) {
    token.nodeType = 1;
    token.tagName = tagNameList.shift();
    if (startTagReg.test(value)) {
      token.type = 'TagOpen';
      const tokenAttrParser = createAttrParser(token);
      token.value.replace(attrReg, tokenAttrParser);
    }
    else if (endTagReg.test(value)) token.type = 'TagClose';
  } else {
    token.nodeType = 3;
  }

  return token;
}

function htmlTokenize(string) {
  const tagRex = /\<([^>]*)\>/gi;
  const tagNextLine = /\n\s*([<>]?)/gi;
  const tagNameList = [];
  const tokenizer = createTokenizer(tagNameList);
  return string.replace(
      tagNextLine,
      (s0, s1) => (s1 === '<' || s1 === '>') ? s1 : _nbsp_
    )
    .replace(tagRex, tokenizer)
    .split(_space_)
    .filter((str) => (str !== _empty_ && str !== _nbsp_))
    .map((str) => createToken(str, tagNameList));
}

function createNode(token) {
  const node = {
    tagName: token.tagName,
    nodeType: token.nodeType,
    children: [],
    data: token.attrs,
    parent: undefined,
    text: token.type === 'Value'
      ? token.value
      : undefined,
  };
  return node;
}

const selfClosedTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
function isSelfClosedTags(tag) {
  return selfClosedTags.indexOf(tag) > -1;
}

function createParser(tokens) {
  const tokenStack = [];
  const nodeStack = [];
  let root, nodeHEAD;
  const parseTag = function(token, i, node) {
    if (i === 0) {
      root = node;
      nodeHEAD = root;
    } else {
      const topNode = nodeStack[nodeStack.length-1];
      if (topNode !== nodeHEAD) {
        nodeStack.push(nodeHEAD);
      }
      if (token.type !== 'TagClose') {
        nodeHEAD.children.push(node);
      }
    }
  };
  const parseHtml = function() {
    for (let i=0;i<tokens.length;i++) {
      const token = tokens[i];
      const node = createNode(token);
      const isElement = token.nodeType === 1;
      const isOpenTag = token.type === 'TagOpen';
      parseTag(token, i, node);
      // elements
      if (isElement) {
        // handle self closed tags
        if (isSelfClosedTags(token.tagName)) {
          continue;
        }
        // handle open or close/text
        if (isOpenTag) {
          nodeHEAD = node;
          tokenStack.push(token);
        } else {
          const topToken = tokenStack[tokenStack.length-1];
          if (topToken.tagName !== token.tagName) throw 'SyntaxError';
          nodeStack.pop();
          nodeHEAD = nodeStack[nodeStack.length-1];
          tokenStack.pop();
        }
      }
    }
    if (tokenStack.length > 0) throw 'SyntaxError';
    console.log('Parse complete');
    return root;
  };
  return {
    parseTag,
    parseHtml,
  };
}

function parseHtmlTokens(inputTokens) {
  const { parseHtml } = createParser(inputTokens);
  return parseHtml();
}

function compileNode(node) {
  if (typeof node !== 'object') return;
  if (node.children.length) {
    for (let i=0;i<node.children.length;i++) {
      const child = node.children[i];
      node.children[i] = compileNode(child);
    }
  }
  return compiler(node.tagName, node.data, ...node.children);
}

export function compileTemplate(string) {
  const tokens = htmlTokenize(string);
  const nodes = parseHtmlTokens(tokens);
  console.log(nodes);
  return compileNode(nodes);
}

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
