import {patchAttr} from "./modules/attr";
import {patchClass} from "./modules/class";
import {patchEvent} from "./modules/event";
import {patchStyle} from "./modules/style";


// 操作DOM属性
export function patchProp(el: HTMLElement, key: string, prevValue: any, nextValue: any) {
    if (key === "class") { // 类名 el.className
        patchClass(el, nextValue);
    } else if (key === "style") { // 样式 el.style
        patchStyle(el, prevValue, nextValue);
    } else if (/^on[^a-z]/.test(key)) { // events: onclick
        patchEvent(el, key, nextValue);
    } else { // 普通属性
        patchAttr(el, key, nextValue);
    }
}
