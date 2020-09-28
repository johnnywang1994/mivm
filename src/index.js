import { patch } from './vdom';
import { watchEffect, scopedCx } from './reactive';
import { renderCx } from './compiler/index';

function setupComponent(options) {
  const { render, data } = options;
  const state = data(scopedCx);
  return (cx) => render(cx, state);
}

function setupRenderer(renderFn) {
  let vnode, oldVnode;

  const updateMount = (el) => () => {
    vnode = renderFn(renderCx);
    patch(
      oldVnode ? oldVnode : el,
      vnode,
    );
    oldVnode = vnode;
  };
  return {
    mount(sel) {
      if (typeof sel === 'string') {
        sel = document.querySelector(sel);
      }
      watchEffect(updateMount(sel));
      return vnode;
    },
  };
}

export const setup = setupComponent;
export const render = setupRenderer;
export * from './vdom';
export * from './reactive';
export * from './compiler';
