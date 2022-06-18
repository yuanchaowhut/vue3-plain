// propsOptions: 组件内部声明接收的属性
// props/rawProps: 用户传的虚拟节点上的属性
// attrs: 用户传了但是组件内部没有声明的属性
import {hasOwn} from "@vue/shared";
import {reactive} from "@vue/reactivity";

export const initProps = (instance: any, rawProps: any) => {
    const props = ({} as any);
    const attrs = ({} as any);
    // 组件内部声明的属性
    const options = instance.propsOptions;

    if (rawProps) {
        for (let key in rawProps) {
            const value = rawProps[key];
            if (hasOwn(options, key)) {
                props[key] = value;
            } else {
                attrs[key] = value;
            }
        }
    }

    // 源码：instance.props = shallowReactive(props);
    // 源码props只支持浅层次响应式，原因是不希望组件内部改props触发更新，
    // 但是我们没有实现 shallowReactive,故这里使用 reactive 代替。
    instance.props = reactive(props);
    instance.attrs = reactive(attrs);
}

const hasPropsChange = (prevProps: any = {}, nextProps: any = {}) => {
    const nextKeys = Object.keys(nextProps);
    // 比对属性个数是否一致
    if (nextKeys.length !== Object.keys(prevProps).length) {
        return true;
    }
    // 比对属性值是否相同
    for (let i = 0; i < nextKeys.length; i++) {
        const key = nextKeys[i];
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }

    return false;
}

export const updateProps = (instance: any, prevProps: any, nextProps: any) => {
    // 属性是否有变化(值、个数)
    if (hasPropsChange(prevProps, nextProps)) {
        for (let key in nextProps) {
            // 由于instance.props是响应式的(instance.props = reactive(props);)，故修改key能触发更新。
            instance.props[key] = nextProps[key];
        }

        // 考虑属性个数减少的情况
        for (let key in instance.props) {
            if (!hasOwn(nextProps, key)) {
                delete instance.props[key];
            }
        }
    }
}
