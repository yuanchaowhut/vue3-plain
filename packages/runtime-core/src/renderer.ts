/**
 * @param renderOptions 不同的平台的 renderOptions 的实现不一样，
 * 但是具体有什么行为都在 runtime-dom 里规定好了
 */
import {isString, ShapeFlags} from "@vue/shared";
import {createVnode, isSameVnode, Text} from "./vnode";

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

    const normalize = (children: any, i: number) => {
        if (isString(children[i])) {
            children[i] = createVnode(Text, null, children[i]);
        }
        return children[i];
    }

    // 渲染children到容器
    const mountChildren = (children: Array<any>, container: HTMLElement) => {
        for (let i = 0; i < children.length; i++) {
            // children[i] 有可能是个字符串，此时需要 normalize 一下，eg:
            let child = normalize(children, i);
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
        if (n1 == null) {
            let el = n2.el = hostCreateText(n2.children);
            hostInsert(el, container);
        } else {
            // 文本内容变化，复用老的节点
            const el = n2.el = n1.el;
            if (n1.children !== n2.children) {
                hostSetText(el, n2.children);
            }
        }
    }

    // 比较2个虚拟节点的属性
    const patchProps = (oldProps: any, newProps: any, el: any) => {
        for (let key in newProps) {
            hostPatchProp(el, key, oldProps[key], newProps[key]);
        }
        // 旧的有新的没有的属性，直接移除.
        for (let key in oldProps) {
            if (newProps[key] == null) {
                hostPatchProp(el, key, oldProps[key], null);
            }
        }
    }

    // 比较2个虚拟节点的children
    // | **新儿子** | **旧儿子** | **操作方式**             |
    // | ---------- | ---------- | ------------------------ |
    //     | 文本       | 数组       | 删除老儿子，设置文本内容 |
    //     | 文本       | 文本       | 更新文本即可             |
    //     | 文本       | 空         | 更新文本即可(与上面类似) |
    //     | 数组       | 数组       | diff算法                 |
    //     | 数组       | 文本       | 清空文本，进行挂载       |
    //     | 数组       | 空         | 进行挂载(与上面类似)     |
    //     | 空         | 数组       | 删除所有儿子             |
    //     | 空         | 文本       | 清空文本                 |
    //     | 空         | 空         | 无需处理                 |
    const patchChildren = (n1: any, n2: any, el: any) => {
        const c1 = n1.children;
        const c2 = n2.children;
        const prevShapeFlag = n1.shapeFlag;
        const shapeFlag = n2.shapeFlag;
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 新的是文本
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 老的是数组，删除老的儿子
                unmountChildren(c1);
            }
            // 老的是文本或空都要更新文本
            if (c1 !== c2) {
                hostSetElementText(el, c2);
            }
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 新的是数组
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 老的是数组，diff 算法

            } else {
                // 老的不管是文本还是空，都可以走下面流程
                hostSetElementText(el, "");
                mountChildren(c2, el);
            }
        } else {
            // 新的是空
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 老的是数组，删除老儿子
                unmountChildren(c1);
            } else {
                // 老的不管是文本还是空都可以走下面流程
                if (c1 !== c2) {
                    hostSetElementText(el, c2);
                }
            }
        }
    };

    // 更新元素(先复用节点，再比较属性，再比较children)
    const patchElement = (n1: any, n2: any, container: any) => {
        // 复用节点
        let el = n2.el = n1.el;
        // 比较属性
        let oldProps = n1.props || {};
        let newProps = n2.props || {};
        patchProps(oldProps, newProps, el);
        // 比较children
        patchChildren(n1, n2, el);
    };

    const processElement = (n1: any, n2: any, container: any) => {
        if (n1 == null) {
            // 初次渲染
            mountElement(n2, container);
        } else {
            // 更新流程
            patchElement(n1, n2, container);
        }
    };

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
        // n1存在的情况下，判断2个元素是否相同，不相同则卸载老的，创建新的。
        if (n1 && !isSameVnode(n1, n2)) {
            unmount(n1);
            n1 = null;
        }
        const {type, shapeFlag} = n2;
        switch (type) {
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container);
                }
        }
    }

    const unmount = (vnode: any) => {
        hostRemove(vnode.el);
    }

    const unmountChildren = (children: any) => {
        for (let i = 0; i < children.length; i++) {
            unmount(children[i]);
        }
    }

    const render = (vnode: any, container: any) => {
        if (vnode == null) {
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
