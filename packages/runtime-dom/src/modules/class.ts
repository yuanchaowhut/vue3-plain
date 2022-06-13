export function patchClass(el: HTMLElement, nextValue: any) {
    if (nextValue === null) {
        el.removeAttribute("class");
    } else {
        el.className = nextValue;
    }
}
