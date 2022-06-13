// 不同的平台的 renderOptions 的实现不一样，但是具体有什么行为都在 runtime-dom 里规定好了
import {renderOptions} from "@vue/runtime-dom";

export function createRenderer(renderOptions: any) {
    return {
        render: function (vnode: any, container: HTMLElement) {
        }
    }
}
