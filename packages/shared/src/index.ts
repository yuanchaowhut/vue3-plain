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
