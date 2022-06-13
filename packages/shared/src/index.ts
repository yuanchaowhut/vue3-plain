export const isString = (value: any) => {
    return typeof value === "string";
}

export const isNumber = (value: any) => {
    return typeof value === "number";
}

export const isBoolean = (value: any) => {
    return typeof value === "boolean";
}

export const isObject = (value: any) => {
    return typeof value === "object" && value !== null;
}

export const isPlainObject = (value: any) => {
    return Object.prototype.toString.call(value) === "[object Object]";
}

export const isFunction = (value: any) => {
    return typeof value === "function";
}

export const isArray = Array.isArray;

export const assign = Object.assign;

// Vue3提供的形状标识
export const enum ShapeFlags {
    ELEMENT = 1,                                 // 2的0次方
    FUNCTIONAL_COMPONENT = 1 << 1,               // 2的1次方
    STATEFULL_COMPONENT = 1 << 2,                // 2的2次方
    TEXT_CHILDREN = 1 << 3,                      // 2的3次方
    ARRAY_CHILDREN = 1 << 4,
    SLOTS_CHILDREN = 1 << 5,
    TELEPORT_CHILDREN = 1 << 6,
    SUSPENSE = 1 << 7,
    COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
    COMPONENT_KEEP_ALIVE = 1 << 9,               // 2的9次方
    COMPONENT = ShapeFlags.STATEFULL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT   // 2 | 4 = 6 -> [0100 | 1000 = 1100]
}

// 通用函数类型
export type FuncType = (...args: any) => any

