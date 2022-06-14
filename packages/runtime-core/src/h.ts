import {createVnode, isVnode} from "./vnode";
import {isArray, isObject} from "@vue/shared";

// h的用法有很多种:
// h("div")

// h("div", {style: {color: "red"}})
// h("div", h("span"))
// h("div", [h("span"), h("span")])
// h("div", "hello")

// h("div", {style:{color: "red"}}, "hello")
// h("div", null, h("span"))
// h("div", null, [h("span")])

// h("div", null, "hello", "world")
// h("div", null, h("span"), h("span"))

export function h(type: any, propsChildren: any, children: any) {
    const len = arguments.length;
    // h("div")
    if (len < 2) {
        return createVnode(type, null);
    } else if (len === 2) {
        // h("div", {style: {color: "red"}})
        // h("div", h("span"))
        // h("div", [h("span"), h("span")])
        // h("div", "hello")
        // h(Text, "hello")
        if (isArray(propsChildren)) {
            return createVnode(type, null, propsChildren);
        } else {
            if (isVnode(propsChildren)) {
                return createVnode(type, null, [propsChildren]);
            } else if (isObject(propsChildren)) {
                return createVnode(type, propsChildren);
            } else {
                return createVnode(type, null, propsChildren);
            }
        }
    } else if (len === 3) {
        // h("div", {style:{color: "red"}}, "hello")
        // h("div", null, h("span"))
        // h("div", null, [h("span")])
        if (isVnode(children)) {
            return createVnode(type, propsChildren, [children]);
        } else {
            return createVnode(type, propsChildren, children);
        }
    } else if (len > 3) {
        // h("div", null, "hello", "world")
        // h("div", null, h("span"), h("span"))
        children = Array.from(arguments).slice(2);
        return createVnode(type, propsChildren, children);
    }
}
