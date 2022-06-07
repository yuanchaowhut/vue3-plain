export let activeEffect = undefined;

class ReactiveEffect {
    // effect默认是激活状态
    public active = true;
    public fn = null;
    // 增加parent属性解决effect嵌套问题
    public parent = null;
    // effect记录它被哪些属性收集过
    public deps = [];

    constructor(fn) {
        this.fn = fn;
    }

    run() {
        // 如果是非激活的状态，只需要执行函数，不需要依赖收集
        if (!this.active) {
            this.fn();
        }
        try {
            this.parent = activeEffect;
            // 这里依赖收集，核心就是将当前的 effect 和稍后渲染的属性关联在一起
            activeEffect = this;
            // 执行this.fn()的时候会使用state.name、state.age等，会调用取值操作get，在get内部就可以获取到全局的activeEffect，
            // 在get里边就可以进行依赖收集，将fn中使用到的响应式数据与activeEffect关联起来。
            return this.fn();
        } catch (e) {
            console.log(e);
        } finally {
            activeEffect = this.parent;
            this.parent = null;
        }
    }
}

// fn 可以根据状态变化重新执行, effect可以嵌套着写
export function effect(fn) {
    // 创建响应式 effect.
    const _effect = new ReactiveEffect(fn);
    // 默认先执行一次
    _effect.run();
}

// 用于做依赖收集，一个effect可以对应多个属性，一个属性也可以对应多个effect
const targetMap = new WeakMap();

export function track(target, type, key) {
    // 收集依赖. 对象 某个属性 -> 多个effect.
    // WeakMap = {target: Map:{key: Set}}。WeakMap的key必须是对象，Set可以去重。
    if (!activeEffect) return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    const shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
        dep.add(activeEffect);
        // 单向记录指的是属性记录了effect，反向记录应该让effect也记录它被哪些属性收集过，这样做的好处是方便清理。
        // dep里有activeEffect,activeEffect的deps属性里也有dep，互相记录.
        activeEffect.deps.push(dep);
    }
}

export function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    const effects = depsMap.get(key); // effects是一个Set.
    effects && effects.forEach(effect => {
        // 避免无限死循环
        if (effect !== activeEffect) {
            effect.run();
        }
    });
}
