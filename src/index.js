import { patch } from './vdom';
import { watchEffect, scopedCx } from './reactive';
import { renderCx, compileTemplate } from './compiler/index';

function renderToVnode(render, state, components) {
  const result = render(renderCx, state);
  result.components = components;
  return result.sel ? result : compileTemplate(result);
}

function createComponent(options) {
  const { render, data = () => {}, components } = options;
  const keyMap = new Map();
  // console.log(keyMap);
  return (key) => {
    if (typeof options === 'function')
    return (cx) => renderToVnode(options, Object.create(null));
    return (cx) => {
      let state;
      if (keyMap.has(key)) {
        state = keyMap.get(key);
      } else {
        keyMap.set(key, state = data(scopedCx) || {});
      }
      const vnode = renderToVnode(render, state, components);
      return vnode;
    };
  };
}

function createRenderer(renderFn) {
  let vnode, oldVnode, state;
  let components = Object.create(null);

  const updateMount = (el) => () => {
    vnode = renderToVnode(renderFn, state, components);
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

  function setComponent(name, setupComponent) {
    components[name] = setupComponent;
  }

  const o = Object.create(null);
  Object.defineProperty(o, 'vnode', { get: () => vnode });
  Object.defineProperty(o, 'mount', { get: () => mount });
  Object.defineProperty(o, 'setState', { get: () => setState });
  Object.defineProperty(o, 'component', { get: () => setComponent });
  return o;
}

function createApp(options) {
  if (typeof options === 'function') {
    return createRenderer(options);
  }
  const {
    components,
    render,
    data = () => {}
  } = options;
  const renderer = createRenderer(render);
  // setState
  renderer.setState(data);
  // setComponents
  for (let name in components) {
    renderer.component(name, components[name]);
  }
  return renderer;
}

export const setup = createComponent;
export const render = createRenderer;
export const renderApp = createApp;
export * from './vdom';
export * from './reactive';
export * from './compiler';
