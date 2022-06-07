import {track, trigger} from "./effect"

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
        return Reflect.get(target, key)
    },
    set(target, key, value, receiver) {
        // 这里可以监控到用户设置值了
        let oldValue = target[key];
        let result = Reflect.set(target, key, value);
        if (oldValue !== value) {
            //要更新
            trigger(target, "set", key, value, oldValue);
        }
        return result;
    }
}
