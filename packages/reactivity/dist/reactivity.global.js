var VueReactivity = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    computed: () => computed,
    effect: () => effect,
    reactive: () => reactive,
    watch: () => watch
  });

  // packages/reactivity/src/effect.ts
  var activeEffect = void 0;
  function cleanupEffect(effect2) {
    const { deps } = effect2;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.deps.length = 0;
  }
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.active = true;
      this.fn = null;
      this.parent = null;
      this.deps = [];
      this.scheduler = null;
      this.fn = fn;
      this.scheduler = scheduler;
    }
    run() {
      if (!this.active) {
        return this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        return this.fn();
      } catch (e) {
        console.log(e);
      } finally {
        activeEffect = this.parent;
        this.parent = null;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
    }
  };
  function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
  var targetMap = /* @__PURE__ */ new WeakMap();
  function track(target, type, key) {
    if (!activeEffect)
      return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    trackEffects(dep);
  }
  function trackEffects(dep) {
    if (!activeEffect)
      return;
    const shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
    }
  }
  function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
      return;
    let effects = depsMap.get(key);
    if (effects && effects.size > 0) {
      triggerEffects(effects);
    }
  }
  function triggerEffects(effects) {
    effects = new Set(effects);
    effects.forEach((effect2) => {
      if (effect2 !== activeEffect) {
        if (effect2.scheduler) {
          effect2.scheduler();
        } else {
          effect2.run();
        }
      }
    });
  }

  // packages/shared/src/index.ts
  var isObject = (value) => {
    return typeof value === "object" && value !== null;
  };
  var isFunction = (value) => {
    return typeof value === "function";
  };
  var isArray = Array.isArray;

  // packages/reactivity/src/baseHandler.ts
  var mutableHandlers = {
    get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      track(target, "get", key);
      let res = Reflect.get(target, key, receiver);
      if (isObject(res)) {
        return reactive(res);
      }
      return res;
    },
    set(target, key, value, receiver) {
      let oldValue = target[key];
      let result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        trigger(target, "set", key, value, oldValue);
      }
      return result;
    }
  };

  // packages/reactivity/src/reactive.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function isReactive(target) {
    return !!(target && target["__v_isReactive" /* IS_REACTIVE */]);
  }
  function reactive(target) {
    if (!isObject(target)) {
      return;
    }
    if (target["__v_isReactive" /* IS_REACTIVE */]) {
      return target;
    }
    let existingProxy = reactiveMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    const proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
  }

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this._dirty = true;
      this.__v_isReadonly = true;
      this.__v_isRef = true;
      this.getter = getter;
      this.setter = setter;
      this.effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true;
          triggerEffects(this.dep);
        }
      });
    }
    get value() {
      trackEffects(this.dep || (this.dep = /* @__PURE__ */ new Set()));
      if (this._dirty) {
        this._dirty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(newValue) {
      this.setter && this.setter(newValue);
    }
  };
  var computed = (getterOrOptions) => {
    let onlyGetter = isFunction(getterOrOptions);
    let getter;
    let setter;
    if (onlyGetter) {
      getter = getterOrOptions;
      setter = () => {
        console.warn("no set");
      };
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
  };

  // packages/reactivity/src/watch.ts
  function watch(source, cb) {
    let getter;
    if (isReactive(source)) {
      getter = () => traversal(source);
    } else if (isFunction(source)) {
      getter = source;
    } else {
      return;
    }
    let cleanup;
    const onCleanup = (fn) => {
      cleanup = fn;
    };
    let oldValue;
    const job = () => {
      if (cleanup)
        cleanup();
      const newValue = effect2.run();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    };
    const effect2 = new ReactiveEffect(getter, job);
    oldValue = effect2.run();
  }
  function traversal(target, set = /* @__PURE__ */ new Set()) {
    if (!isObject(target)) {
      return target;
    }
    if (set.has(target)) {
      return target;
    }
    set.add(target);
    for (let key in target) {
      traversal(target[key], set);
    }
    return target;
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
