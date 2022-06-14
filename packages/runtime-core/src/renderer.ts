/**
 * @param renderOptions 不同的平台的 renderOptions 的实现不一样，
 * 但是具体有什么行为都在 runtime-dom 里规定好了
 */
import {isString, ShapeFlags} from "@vue/shared";
import {createVnode, Text} from "./vnode";

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

    const normalize = (child: any) => {
        if (isString(child)) {
            return createVnode(Text, null, child);
        }
        return child;
    }

    // 渲染children到容器
    const mountChildren = (children: Array<any>, container: HTMLElement) => {
        for (let i = 0; i < children.length; i++) {
            // children[i] 有可能是个字符串，此时需要 normalize 一下，eg:
            let child = normalize(children[i]);
            patch(null, child, container);
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

    const processText = (n1: any, n2: any, container: any) => {
        if (n1 === null) {
            let el = n2.el = hostCreateText(n2.children);
            hostInsert(el, container);
        }
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
        const {type, shapeFlag} = n2;
        // 初次渲染
        if (n1 === null) {
            switch (type) {
                case Text:
                    processText(n1, n2, container);
                    break;
                default:
                    if (shapeFlag & ShapeFlags.ELEMENT) {
                        mountElement(n2, container);
                    }
            }
        } else {
            // 更新流程
        }
    }

    const unmount = (vnode: any) => {
        hostRemove(vnode.el);
    }

    const render = (vnode: any, container: any) => {
        if (vnode === null) {
            // 卸载逻辑
            if (container._vnode) {
                unmount(container._vnode);
            }
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
