import {isFunction} from "@vue/shared";
import {ReactiveEffect, trackEffects, triggerEffects} from "./effect";

class ComputedRefImpl {
    public getter!: Function;
    public setter!: Function | undefined;
    public effect: ReactiveEffect;
    public _value: any;
    public _dirty = true;  // 默认应该进行取值计算
    public __v_isReadonly = true;
    public __v_isRef = true;
    public dep!: Set<any>; // 计算属性用于收集外部依赖

    constructor(getter: Function, setter?: Function) {
        this.getter = getter;
        this.setter = setter;
        // computed内部封装了一个effect，将用户传入的getter放到内部effect中，这里边的firstName、lastName就会收集到这个内部effect。
        // 当 firstName、lastName 后面发生变化时，这个内部effect就会执行它的调度器函数。
        this.effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true;
                // 触发外部effect更新
                triggerEffects(this.dep);
            }
        });
    }

    // get value() 、set value(newValue) 是类中的属性访问器，底层就是 Object.defineProperty.
    get value() {
        // 做依赖收集，它收集到的是使用了计算属性的effect(外层effect)
        trackEffects(this.dep || (this.dep = new Set));

        if (this._dirty) {
            this._dirty = false;
            this._value = this.effect.run();
        }
        return this._value;
    }

    set value(newValue) {
        this.setter && this.setter(newValue);
    }
}

export const computed = (getterOrOptions: any) => {
    let onlyGetter = isFunction(getterOrOptions);
    let getter;
    let setter;
    if (onlyGetter) {
        getter = getterOrOptions
        setter = () => {
            console.warn('no set')
        }
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }

    return new ComputedRefImpl(getter, setter);
}
