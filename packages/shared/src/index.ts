import {isFunction} from "@vue/reactivity";

export const isObject = (obj: any) => {
    return Object.prototype.toString.call(obj) === "[object Object]";
}
