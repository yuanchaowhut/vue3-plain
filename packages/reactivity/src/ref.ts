import {isArray, isObject} from "@vue/shared";
import {reactive} from "./reactive";
import {trackEffects, triggerEffects} from "./effect";

function toReactive(value: any) {
    return isObject(value) ? reactive(value) : value;
}

class RefImpl {
    public rawValue: any;
    public _value: any;
    public dep: Set<any> = new Set();
    public __v_isRef = true;

    constructor(rawValue: any,) {
        this.rawValue = rawValue;
        this._value = toReactive(rawValue);
    }

    get value() {
        trackEffects(this.dep);
        return this._value;
    }

    set value(newValue) {
        if (this.rawValue !== newValue) {
            this._value = toReactive(newValue);
            this.rawValue = newValue;
            triggerEffects(this.dep);
        }
    }
}

export function ref(value: any) {
    return new RefImpl(value);
}

class ObjectRefImpl {
    constructor(public target: any, public key: string) {
    }

    get value() {
        // target 是一个 Proxy 对象，故此处读取 this.target[this.key] 会收集依赖。
        return this.target[this.key];
    }

    set value(newValue) {
        // target 是一个 Proxy 对象，故此处修改 this.target[this.key] 会触发更新。
        this.target[this.key] = newValue;
    }
}

export function toRef(target: any, key: string) {
    return new ObjectRefImpl(target, key);
}

export function toRefs(target: any) {
    // target 是一个 Proxy 对象。
    let result = isArray(target) ? new Array(target.length) : ({} as Record<string, any>);
    for (let key in target) {
        result[key] = toRef(target, key);
    }
    return result;
}

export function proxyRefs(object: any) {
    return new Proxy(object, {
        get(target, key, receiver) {
            const r = Reflect.get(target, key, receiver);
            // 如果是ref对象就返回.value，否则返回自己.
            return r.__v_isRef ? r.value : r;
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            if (oldValue.__v_isRef) {
                oldValue.value = value;
                return true;  // 必须 return true
            } else {
                return Reflect.set(target, key, value, receiver);
            }
        },
    })
}
