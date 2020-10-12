import { htmlTokenize } from './tokenizer';
import { compiler } from './compiler';

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
    // console.log('Parse complete');
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

function compileNode(node, deps, components) {
  if (typeof node !== 'object') return;
  if (node.children.length) {
    for (let i=0;i<node.children.length;i++) {
      const child = node.children[i];
      node.children[i] = child.text ||
        compileNode(child, deps, components);
    }
  }
  const tag = (components && node.tagName in components)
    ? components[node.tagName]
    : node.tagName;
  return compiler(
    tag,
    node.data,
    deps,
    components,
    ...node.children
  );
}

export function compileTemplate(result) {
  const { template, deps, components } = result;
  const tokens = htmlTokenize(template);
  const nodes = parseHtmlTokens(tokens);
  return compileNode(nodes, deps, components);
}

export * from './compiler';
