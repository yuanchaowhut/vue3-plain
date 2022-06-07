export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive"
}

export const mutableHandlers = {
    get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true
        }
        // Reflect 保证this指向的是proxy对象
        return Reflect.get(target, key)
    },
    set(target, key, value, receiver) {
        // 这里可以监控到用户设置值了
        return Reflect.set(target, key, value)
    }
}
