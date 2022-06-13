export function patchAttr(el: HTMLElement, key: string, nextValue: any) {
    if (nextValue) {
        el.setAttribute(key, nextValue);
    } else {
        el.removeAttribute(key);
    }
}
