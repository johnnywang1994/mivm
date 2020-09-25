import { createElm } from './create-element';

export function mount(vnode, el) {
  if (typeof el === 'string') {
    el = document.querySelector(el);
  }
  const app = createElm(vnode);
  if ('replaceWith' in el) {
    el.replaceWith(app);
  } else {
    const parent = el.parentNode;
    parent.insertBefore(app, el);
    parent.removeChild(el);
  }
  return vnode;
}
