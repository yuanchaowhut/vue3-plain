export let activeEffect = undefined;

function cleanupEffect(effect) {
    // activeEffect.deps -> [(name->Set), (age->Set)]
    const {deps} = effect;

    // 遍历每个Set，在Set中删除当前这个effect.
    for (let i = 0; i < deps.length; i++) {
        //解除依赖，重做依赖收集。set.delete(e)，删除由其值指定的元素。
        deps[i].delete(effect);
    }
    effect.deps.length = 0;
}

export class ReactiveEffect {
    // effect默认是激活状态
    public active = true;
    public fn = null;
    // 增加parent属性解决effect嵌套问题
    public parent = null;
    // effect记录它被哪些属性收集过
    public deps = [];
    // 调度器
    public scheduler = null;

    constructor(fn, scheduler) {
        this.fn = fn;
        this.scheduler = scheduler;
    }

    run() {
        // 如果是非激活的状态，只需要执行函数，不需要依赖收集
        if (!this.active) {
            return this.fn();
        }
        try {
            this.parent = activeEffect;
            // 这里依赖收集，核心就是将当前的 effect 和稍后渲染的属性关联在一起
            activeEffect = this;
            // 先清空所有
            cleanupEffect(this);
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

    stop() {
        if (this.active) {
            this.active = false;
            cleanupEffect(this);
        }
    }
}

// fn 可以根据状态变化重新执行, effect可以嵌套着写
export function effect(fn, options: any = {}) {
    // 创建响应式 effect.
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // 默认先执行一次
    _effect.run();
    // 如果不使用bind则将来执行runner() 时，里边的this就是window。
    const runner = _effect.run.bind(_effect);
    // 将_effect挂在runner上
    runner.effect = _effect;
    return runner;
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

    trackEffects(dep);
}

export function trackEffects(dep: Set<any>) {
    if (!activeEffect) return;
    const shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
        dep.add(activeEffect);
        // 单向记录指的是属性记录了effect，反向记录应该让effect也记录它被哪些属性收集过，这样做的好处是方便清理。
        // dep里有activeEffect,activeEffect的deps属性里也有dep，互相记录.
        // activeEffect.deps -> [(name->Set), (age->Set)]
        activeEffect.deps.push(dep);
    }
}

export function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    let effects = depsMap.get(key);
    if (effects && effects.size > 0) {
        triggerEffects(effects);
    }
}

export function triggerEffects(effects) {
    // 拷贝一份，新effects和原来的effects内存地址已经不同，但是里边一个一个的effect元素的指向还是保持一致。
    effects = new Set(effects);
    effects.forEach(effect => {
        if (effect !== activeEffect) {
            // 如果用户传入了调度函数，则用执行调度函数，否则默认执行
            if (effect.scheduler) {
                effect.scheduler();
            } else {
                effect.run();
            }
        }
    });
}
