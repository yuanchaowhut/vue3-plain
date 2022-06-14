import {nodeOps} from "./nodeOps";
import {patchProp} from "./patchProps";
import {createRenderer} from "@vue/runtime-core";

// 不同的平台的 renderOptions 的实现不一样，但是具体有什么行为都在 runtime-dom 里规定好了
export const renderOptions = Object.assign(nodeOps, {patchProp});

// 将虚拟DOM渲染出来
export function render(vnode: any, container: HTMLElement) {
    createRenderer(renderOptions).render(vnode, container);
}

// 将createRenderer、h、Text 等导出
export * from "@vue/runtime-core";
