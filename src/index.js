import { patch } from './vdom';
import { watchEffect, scopedCx } from './reactive';
import { renderCx, compileTemplate } from './compiler';

function createComponent(options) {
  const { render, data = () => {} } = options;
  const keyMap = new Map();
  // console.log(keyMap);
  return (key) => (cx) => {
    let state;
    if (keyMap.has(key)) {
      state = keyMap.get(key);
    } else {
      keyMap.set(key, state = data(scopedCx));
    }
    const vnode = compileTemplate(render(cx, state));
    return vnode;
  };
}

function createRenderer(renderFn) {
  let vnode, oldVnode, state;

  const updateMount = (el) => () => {
    vnode = compileTemplate(renderFn(renderCx, state));
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

  function setState(data) {
    state = data(scopedCx);
  }

  const o = Object.create(null);
  Object.defineProperty(o, 'vnode', { get: () => vnode });
  Object.defineProperty(o, 'mount', { get: () => mount });
  Object.defineProperty(o, 'setState', { get: () => setState });
  return o;
}

function createApp(options) {
  if (typeof options === 'function') {
    return createRenderer(options);
  }
  const { render, data = () => {} } = options;
  const renderer = createRenderer(render);
  renderer.setState(data);
  return renderer;
}

export const setup = createComponent;
export const render = createRenderer;
export const renderApp = createApp;
export * from './vdom';
export * from './reactive';
export * from './compiler';
