import {isArray, isObject, isString, ShapeFlags} from "@vue/shared";

// 表示文本节点类型，例如：render(h(Text, "hello"));
export const Text = Symbol("Text");
// Fragment类型
export const Fragment = Symbol("Fragment");

/**
 * 判断是否为虚拟DOM节点
 * @param value
 */
export function isVnode(value: any) {
    return !!(value && value.__v_isVnode)
}

/**
 * 判断两个虚拟节点是不是同一个节点，方法是：1.标签名相同；2.key是一样
 * @param n1
 * @param n2
 */
export function isSameVnode(n1: any, n2: any) {
    return n1.type === n2.type && n1.key === n2.key;
}

/**
 * 创建VNode
 * @param type  组件的、元素的、文本的
 * @param props
 * @param children
 */
export function createVnode(type: any, props: any, children: any = null) {
    // 用shapeFlag表示组合方案，如：9=元素+文本节点, 17=元素+ARRAY_CHILDREN
    let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isObject(type) ? ShapeFlags.STATEFULL_COMPONENT : 0;

    // 虚拟DOM就是一个对象，diff算法。真实DOM的属性比较多
    const vnode: Record<string, any> = {
        type,
        props,
        children,
        el: null, // 虚拟节点对应的真实节点，后续diff算法完成后渲染真实DOM要用到
        key: props?.key,
        __v_isVnode: true,
        shapeFlag
    };
    if (children) {
        let type = 0;
        if (isArray(children)) {
            type = ShapeFlags.ARRAY_CHILDREN;
        } else {
            vnode.children = String(children); // 文本节点
            type = ShapeFlags.TEXT_CHILDREN;
        }
        vnode.shapeFlag |= type;  // 元素本身的type | children的type = 组合，后面使用的地方可以解析出来
    }

    return vnode;
}
