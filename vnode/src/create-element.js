function renderVNode(vnode) {
  const el = vnode.el = document.createElement(vnode.tagName);
  return el;
}

function renderTxtVNode(vnode) {
  const el = vnode.el = document.createTextNode(vnode.text);
  return el;
}

function renderData(el, vnode, oldVnode) {
  const { data } = vnode;
  if (!data) return;
  const { attrs, on } = data;
  const oldOn = oldVnode && oldVnode.data && oldVnode.data.on;
  for (let key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
  for (let evt in on) {
    if (oldOn && oldOn[evt]) el.removeEventListener(evt, oldOn[evt]);
    el.addEventListener(evt, on[evt]);
  }
}

function renderChildrens(el, vnode) {
  const { childrens } = vnode;
  if (!childrens) return;
  for (let i in childrens) {
    const child = createElm(childrens[i]);
    el.appendChild(child);
  }
}

export function createElm(vnode) {
  let e;
  if (typeof vnode.text === 'string') {
    e = renderTxtVNode(vnode);
  } else {
    e = renderVNode(vnode);
  }
  updateElm(e, vnode);
  return e;
}

export function updateElm(el, vnode, oldVnode) {
  if (vnode.data) renderData(el, vnode, oldVnode);
  if (vnode.childrens && !oldVnode) renderChildrens(el, vnode);
}
