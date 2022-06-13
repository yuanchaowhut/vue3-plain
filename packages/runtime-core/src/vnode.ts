import {isArray, isString, ShapeFlags} from "@vue/shared";

/**
 * 判断是否为虚拟DOM节点
 * @param value
 */
export function isVnode(value: any) {
    return !!(value && value.__v_isVnode)
}

/**
 * 创建VNode
 * @param type  组件的、元素的、文本的
 * @param props
 * @param children
 */
export function createVnode(type: string, props: any, children: any = null) {
    // 组合方案：shapeFlag
    let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

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
            // children = String(children);
            type = ShapeFlags.TEXT_CHILDREN;
        }
        vnode.shapeFlag |= type
    }

    return vnode;
}
