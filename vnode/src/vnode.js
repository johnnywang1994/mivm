export function vnode(
  tagName,
  data,
  childrens,
  el,
  text,
) {
  const key = data === undefined ? undefined : data.key;
  return {
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
