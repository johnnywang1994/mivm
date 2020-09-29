import { patch } from './vdom';
import { watchEffect, scopedCx } from './reactive';
import { renderCx } from './compiler/index';

function setupComponent(options) {
  const { render, data } = options;
  const keyMap = new Map();
  console.log(keyMap);
  return (key) => (cx) => {
    let state;
    if (keyMap.has(key)) {
      state = keyMap.get(key);
    } else {
      keyMap.set(key, state = data(scopedCx));
    }
    const vnode = render(cx, state);
    return vnode;
  };
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

  function mount(sel) {
    if (typeof sel === 'string') {
      sel = document.querySelector(sel);
    }
    watchEffect(updateMount(sel));
    return this;
  }

  const o = Object.create(null);
  Object.defineProperty(o, 'vnode', { get: () => vnode });
  Object.defineProperty(o, 'mount', { get: () => mount });
  return o;
}

export const setup = setupComponent;
export const render = setupRenderer;
export * from './vdom';
export * from './reactive';
export * from './compiler';
