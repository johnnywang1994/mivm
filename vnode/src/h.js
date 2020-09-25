import { vnode, createTextVnode } from './vnode';

function createVNode(tagName, data, childrens) {
  const _vnode = vnode(tagName, data, childrens);
  parseData(_vnode, data);
  parseChildrens(_vnode, childrens);
  return _vnode;
}

function parseData(_vnode, data) {
  if (isChildrenBlock(data)) {
    parseChildrens(_vnode, data);
    _vnode.data = Object.create(null);
    return;
  }
  const { attrs } = data;
  parseAttrs(_vnode, attrs);
}

function parseChildrens(_vnode, childrens) {
  if (!childrens) return;
  if (typeof childrens === 'string') {
    const txtVnode = createTextVnode(childrens);
    _vnode.childrens = [txtVnode];
    return;
  }
  for (let i in childrens) {
    const child = childrens[i];
    if (typeof child === 'string') {
      const txtVnode = createTextVnode(child);
      childrens[i] = txtVnode;
    }
  }
}

function parseAttrs(_vnode, attrs) {
  for (let key in attrs) {
    const val = attrs[key];
    if (key === 'key') {
      _vnode.key = val;
    }
  }
}

function isChildrenBlock(v) {
  return Array.isArray(v) || typeof v === 'string';
}

export const h = createVNode;
