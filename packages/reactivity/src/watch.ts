import {ReactiveEffect} from "./effect";
import {isReactive} from "./reactive";
import {isFunction, isObject, FuncType} from "@vue/shared";


/**
 * @param source 用户传入的对象
 * @param cb 用户传入的回调
 */
export function watch(source: any, cb: FuncType) {
    let getter;
    if (isReactive(source)) {
        // 需要对source进行递归遍历，遍历的过程中会访问对象上的每一个属性，
        // 访问属性的时候就会触发收集我们在下面构造的这个effect.
        getter = () => traversal(source);
    } else if (isFunction(source)) {
        // 如果传入的本来就是函数，如: () => person.name，由于person是响应式对象，
        // 故 person.name 本身就会触发收集依赖，所以就不需要我们手动递归遍历去收集。
        getter = source;
    } else {
        return;
    }

    // 用于处理异步的清理函数
    let cleanup: FuncType;
    const onCleanup = (fn: FuncType) => {
        cleanup = fn; // 保存用户的函数
    }

    let oldValue: any;
    const job = () => {
        // 首次执行job时cleanup是undefined,下一次触发watch会执行上一次的cleanup
        if (cleanup) cleanup();
        const newValue = effect.run();
        cb(newValue, oldValue, onCleanup);
        oldValue = newValue;
    }
    // 监控自己构造的函数，数据变化后重新执行job.
    const effect = new ReactiveEffect(getter, job);

    oldValue = effect.run();
}

/**
 * 递归遍历，深度访问一个对象上的所有属性。
 * @param target
 * @param set
 */
function traversal(target: any, set = new Set()) {
    if (!isObject(target)) {
        return target;
    }
    // 防止循环引用
    if (set.has(target)) {
        return target;
    }
    set.add(target);
    for (let key in target) {
        traversal(target[key], set);
    }

    return target;
}
