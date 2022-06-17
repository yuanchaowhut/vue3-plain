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
