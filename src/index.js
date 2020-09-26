import { watchEffect } from '../reactive/index';
import { h, patch } from '../vnode/index';

export function setup(setupFn, options) {
  let oldVnode, vnode;
  const updateMount = (el) => () => {
    vnode = setupFn(h);
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
    }
  };
}

export * from '../reactive/index';
