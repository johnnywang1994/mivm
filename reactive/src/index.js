const proxyCache = new WeakMap();
const rawCache = new WeakMap();
const trackMap = new WeakMap();
const effectCache = [];

const normalHandler = {
  get: (target, key, receiver) => {
    const res = Reflect.get(target, key, receiver);
    track(target, key);
    return res;
  },
  set: (target, key, value, receiver) => {
    const res = Reflect.set(target, key, value, receiver);
    trigger(target, key);
    return res;
  }
};

function isObject(v) {
  return v !== null && typeof v === 'object';
}

function createReactive(target) {
  if (!isObject(target)) return target;
  let observed = proxyCache.get(target);
  if (observed) return observed;
  if (rawCache.get(target)) return target;
  observed = new Proxy(target, normalHandler);
  proxyCache.set(target, observed);
  rawCache.set(observed, target);
  return observed;
}

function createEffect(fn) {
  const effect = function() {
    return runEffect(effect, fn);
  };
  return effect;
}

function runEffect(effect, fn) {
  try {
    effectCache.push(effect);
    return fn();
  } finally {
    effectCache.pop(effect);
  }
}

function track(target, key) {
  const effect = effectCache[effectCache.length - 1];
  if (effect) {
    let depsMap = trackMap.get(target);
    if (!depsMap) {
      trackMap.set(target, depsMap = new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = new Set());
    }
    if (!dep.has(effect)) {
      dep.add(effect);
    }
  }
}

function trigger(target, key) {
  const depsMap = trackMap.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);
  if (effects) {
    effects.forEach((effect) => effect());
  }
}

export function reactive(target) {
  return createReactive(target);
}

export function watchEffect(fn) {
  const effect = createEffect(fn);
  effect();
  return effect;
}
