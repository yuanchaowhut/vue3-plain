import {isObject} from "@vue/shared";
import {ReactiveFlags, mutableHandlers} from "./baseHandler";

// 用于缓存原对象和代理对象的映射关系，注意，WeakMap的key只能是对象。
const reactiveMap = new WeakMap();

/**
 * 1.实现同一个对象代理多次，返回同一个代理对象
 * 2.实现代理对象被再次代理，返回原来的代理对象
 * @param target
 */
export function reactive(target: any) {
    if (!isObject(target)) {
        return;
    }

    // 第一次普通对象代理，我们会通过new Proxy 代理一次，下一次你传递的如果本身就是Proxy就不需要再new Proxy了。
    if (target[ReactiveFlags.IS_REACTIVE]) {
        return target;
    }

    // 实现同一个对象代理多次，返回同一个代理对象
    let existingProxy = reactiveMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }

    // 并没有重新定义属性，只是代理，在取值的时候调用get，当赋值时会调用set.
    const proxy = new Proxy(target, mutableHandlers);
    // 缓存
    reactiveMap.set(target, proxy);

    return proxy;
}
