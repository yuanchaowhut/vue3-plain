/**
 * @param renderOptions 不同的平台的 renderOptions 的实现不一样，
 * 但是具体有什么行为都在 runtime-dom 里规定好了
 */
import {ShapeFlags} from "@vue/shared";

export function createRenderer(renderOptions: any) {
    let {
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText,
        setText: hostSetText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        createElement: hostCreateElement,
        createText: hostCreateText,
        patchProp: hostPatchProp
    } = renderOptions;

    // 渲染children到容器
    const mountChildren = (children: Array<any>, container: HTMLElement) => {
        for (let i = 0; i < children.length; i++) {
            patch(null, children[i], container);
        }
    }

    /**
     * 渲染真实DOM元素到容器
     * @param vnode
     * @param container
     */
    const mountElement = (vnode: any, container: any) => {
        let {type, props, children, shapeFlag} = vnode;
        // 将真实DOM元素挂载到虚拟节点，后续用于复用节点和更新
        let el = vnode.el = hostCreateElement(type);
        // 更新属性
        if (props) {
            for (let key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, children);
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el);
        }
        // 将真实DOM添加到容器
        hostInsert(el, container);
    }

    /**
     * 更新真实DOM的方法
     * @param n1 上一次的虚拟节点
     * @param n2 本次的虚拟节点
     * @param container 容器
     */
    const patch = (n1: any, n2: any, container: any) => {
        if (n1 === n2) {
            return;
        }
        if (n1 === null) {
            // 初次渲染 后续还有组件的初次渲染，目前是元素的初始化渲染
            mountElement(n2, container);
        } else {
            // 更新流程
        }
    }

    const render = (vnode: any, container: any) => {
        if (vnode === null) {
            // 卸载逻辑

        } else {
            // patch 既包含初始化逻辑又包含更新逻辑
            patch(container._vnode || null, vnode, container);
        }
        container._vnode = vnode;
    }

    return {
        render
    }
}
