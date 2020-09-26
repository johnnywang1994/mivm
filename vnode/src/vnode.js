export function vnode(
  tagName,
  data,
  childrens,
  el,
  text,
) {
  const key = data === undefined ? undefined : data.key;
  return {
    __vnode__: true,
    tagName,
    data,
    childrens,
    el,
    text,
    key,
  };
}

export function createTextVnode(text) {
  const txtVdom = vnode();
  txtVdom.text = text;
  return txtVdom;
}

export function createVnodeAt(el) {
  const v = vnode();
  v.el = el;
  return v;
}
