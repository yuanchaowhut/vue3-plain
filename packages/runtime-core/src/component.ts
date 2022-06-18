import {proxyRefs, reactive} from "@vue/reactivity";
import {initProps} from "./componentProps";
import {hasOwn, isFunction, isObject} from "@vue/shared";

export function createComponentInstance(vnode: any) {
    // 组件实例
    const instance = {
        data: null,
        vnode,
        subTree: null,
        isMounted: false,
        update: () => {
        },
        propsOptions: vnode.type.props, // 组件内部声明接收的属性
        props: {},    // 用户传的虚拟节点上的属性
        attrs: {},    // 用户传了但是组件内部没有声明的属性
        proxy: null,
        render: null,
        setupState: {} //setup的返回值
    }

    return instance;
}

// 组件实例的一些公共属性
const publicPropertyMap: any = {
    $attrs: (instance: any) => instance.attrs
}

const publicProxyInstance = {
    get(target: any, key: any) {
        const {data, props, setupState} = target;
        // this.xxx 首先从data中取
        if (data && hasOwn(data, key)) {
            return data[key];
        }
        // 其次从setupState中取
        if (setupState && hasOwn(setupState, key)) {
            return (setupState as any)[key];
        }
        // 其次从props中取
        if (props && hasOwn(props, key)) {
            return (props as any)[key];
        }
        // 最后从instance取
        let getter = publicPropertyMap[key];
        if (getter) {
            return getter(target);
        } else {
            getter = publicPropertyMap["$attrs"];
            return getter(target)[key];
        }
    },
    // @ts-ignore
    set(target, key, value) {
        const {data, props, setupState} = target;
        // this.xxx = xxx 首先给data中赋值
        if (data && hasOwn(data, key)) {
            data[key] = value;
            return true;
        }
        // this.xxx = xxx 其次给setupState中赋值
        if (setupState && hasOwn(setupState, key)) {
            setupState[key] = value;
            return true;
        }
        // 如果是想给props赋值，则给出警告信息
        if (props && hasOwn(props, key)) {
            console.warn("attempting to mutate prop" + (key as string));
            return false;
        }
        return true;
    }
}

export function setupComponent(instance: any) {
    // 初始化属性
    // vnode.props是在createVnode中赋值的，createVnode是在h函数中调用的.
    const {props, type} = instance.vnode;
    initProps(instance, props);

    // 初始化代理对象(代理 data、props、attrs 等)
    // instance.proxy 就是组件中的this，当我们使用 this.$attrs 时，
    // 就会走 instance.proxy 的get方法,此时key就是$attrs
    instance.proxy = new Proxy(instance, publicProxyInstance);

    // 初始化data
    let data = type.data;
    if (data) {
        if (!isFunction(data)) {
            console.warn("data options must be a function!");
            return;
        }
        // instance.data 是响应式
        instance.data = reactive(data.call(instance.proxy));
    }

    // setup 选项
    let setup = type.setup;
    if (setup) {
        const setupContext = {};
        const setupResult = setup(instance.props, setupContext);
        // setup函数的返回结果支持2种类型：对象、函数。
        if (isFunction(setupResult)) {
            instance.render = setupResult;
        } else if (isObject(setupResult)) {
            // proxyRefs 用于去除ref对象变量的.value，方便取值.
            instance.setupState = proxyRefs(setupResult);
        }
    }

    // 初始化render
    if (!instance.render) {
        instance.render = type.render;
    }
}
