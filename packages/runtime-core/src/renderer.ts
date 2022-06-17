/**
 * @param renderOptions 不同的平台的 renderOptions 的实现不一样，
 * 但是具体有什么行为都在 runtime-dom 里规定好了
 */
import {isString, ShapeFlags} from "@vue/shared";
import {createVnode, Fragment, isSameVnode, Text} from "./vnode";
import {getSequence} from "./sequence";

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
    const mountElement = (vnode: any, container: any, anchor: any) => {
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
        hostInsert(el, container, anchor);
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

    const processFragment = (n1: any, n2: any, container: any) => {
        if (n1 == null) {
            mountChildren(n2.children, container);
        } else {
            patchChildren(n1, n2, container);
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

    const patchKeyedChildren = (c1: any, c2: any, el: any) => {
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        // -----------------------diff算法优化部分(即符合一定规律的情况快速处理)-----------------------
        // sync from start: 从头开始比较，长得一样的就略过，只比较那些不一样的。
        while (i <= e1 && i <= e2) {
            let n1 = c1[i];
            let n2 = c2[i];
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, el);
            } else {
                break;
            }
            i++;
        }

        // sync from end: 从头末尾开始比较，长得一样的就略过，只比较那些不一样的。
        while (i <= e1 && i <= e2) {
            let n1 = c1[e1];
            let n2 = c2[e2];
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, el);
            } else {
                break;
            }
            e1--;
            e2--;
        }

        if (i > e1) {
            // common sequence + mount i 比 e1 大说明有新增的，i 和 e2 之间的部门就是需要新增的部分。
            if (i <= e2) {
                while (i <= e2) {
                    let nextPos = e2 + 1;  // e2后面有元素表示往前插(insertBefore),没有元素则表示往后插(appendChild)
                    let anchor = nextPos < c2.length ? c2[nextPos].el : null;
                    patch(null, c2[i], el, anchor); // 创建新节点扔到容器中
                    i++;
                }
            }
        } else if (i > e2) {
            // common sequence + unmount: 同序列卸载：i 比 e2 大说明有卸载的，i 和 e1 之间的部门就是需要卸载的部分。
            if (i <= e1) {
                while (i <= e1) {
                    unmount(c1[i]);  // 卸载元素
                    i++;
                }
            }
        }
        console.log(i, e1, e2);
        // -----------------------------------diff算法实现乱序比对------------------------------------
        // unknown sequence
        const s1 = i;
        const s2 = i;
        // keyToNewIndexMap里存储的是新children的key和索引的映射关系: {key1: index1, key2: index2}
        const keyToNewIndexMap = new Map();
        // 即将进行比对的新节点的个数
        const toBePatched = e2 - s2 + 1;
        // 一个记录是否已经比对过的映射表
        const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
        for (let i = s2; i <= e2; i++) {
            keyToNewIndexMap.set(c2[i].key, i);
        }
        console.log(keyToNewIndexMap);
        // 循环老children，看一下新的里边有没有？
        // 如果有则复用并对比差异，如果老的有新的没有则删除，如果老的没有新的有则添加。
        for (let i = s1; i <= e1; i++) {
            const oldChild = c1[i];
            const newIndex = keyToNewIndexMap.get(oldChild.key);
            if (newIndex === undefined) {
                unmount(oldChild);
            } else {
                // 由于数组中的元素默认是0，而i也可能是0，为了以示区分，故这里故意+1。
                // 其实数组元素的具体值不重要，后面也不会使用，仅仅用于区分0或非0,
                // 0表示没有比对过，非0表示对比过。
                newIndexToOldIndexMap[newIndex - s2] = i + 1;
                patch(oldChild, c2[newIndex], el);
            }
        }

        console.log("newIndexToOldIndexMap: ", newIndexToOldIndexMap);  // [5, 3, 4, 0]  e,c,d,h
        //获取最长递增子序列，其结果为原数组中的元素的索引组成的数组.
        let increment = getSequence(newIndexToOldIndexMap); // increment:[1, 2] -> [3,4] -> c,d 不用动
        let j = increment.length - 1;

        // 需要移动位置（倒序遍历，因为可能需要使用insertBefore）
        for (let i = toBePatched - 1; i >= 0; i--) {
            let index = i + s2;  // c2的索引
            let current = c2[index]; // c2中最后一个需要比对的节点
            let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
            if (newIndexToOldIndexMap[i] === 0) {
                // 当前节点没有比对过，需要创建
                patch(null, current, el, anchor);
            } else {
                if (i !== increment[j]) {
                    // 当前节点在递增子序列中不存在，并且节点比对过，执行插入操作即可
                    hostInsert(current.el, el, anchor);
                } else {
                    // 当前节点在递增子序列中存在，并且也比对过，直接跳过.
                    j--;
                }
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
                patchKeyedChildren(c1, c2, el);  // 全量对比
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

    const processElement = (n1: any, n2: any, container: any, anchor: any) => {
        if (n1 == null) {
            // 初次渲染
            mountElement(n2, container, anchor);
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
    const patch = (n1: any, n2: any, container: any, anchor: any = null) => {
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
            case Fragment:
                processFragment(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, anchor);
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
