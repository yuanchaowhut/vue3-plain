import {track, trigger} from "./effect"
import {isObject} from "@vue/shared";
import {reactive} from "./reactive";

export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive"
}

export const mutableHandlers = {
    get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true
        }
        // 收集依赖.
        track(target, "get", key);

        // Reflect 保证this指向的是proxy对象
        let res = Reflect.get(target, key, receiver);

        // 如果 res 是对象，则响应式处理一下。
        if (isObject(res)) {
            return reactive(res);
        }
        return res;
    },
    set(target, key, value, receiver) {
        // 这里可以监控到用户设置值了
        let oldValue = target[key];
        let result = Reflect.set(target, key, value, receiver);
        if (oldValue !== value) {
            //要更新
            trigger(target, "set", key, value, oldValue);
        }
        return result;
    }
}
