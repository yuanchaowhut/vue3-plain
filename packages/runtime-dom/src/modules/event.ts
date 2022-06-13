import {FuncType} from "@vue/shared";

function createInvoker(callback: FuncType) {
    const invoker = (e: any) => invoker.value(e);
    invoker.value = callback;
    return invoker;
}

/**
 *
 * @param el
 * @param eventName eg：onClick
 * @param nextValue () => {}
 */
export function patchEvent(el: HTMLElement, eventName: string, nextValue: any) {
    // vei：vnode event invoker
    let invokers = el._vei || (el.vei = {});
    let exist = invokers[eventName];
    if (exist) {
        // 之前绑定过该事件
        if (nextValue) {
            invokers[eventName].value = nextValue;
        } else {
            el.removeEventListener(eventName.slice(2).toLowerCase(), exist);
            invokers[eventName] = undefined;
        }
    } else {
        // 之前没绑定过该事件
        let event = eventName.slice(2).toLowerCase();  // onClick => click
        if (nextValue) {
            const invoker = invokers[eventName] = createInvoker(nextValue);
            el.addEventListener(event, invoker);
        }
    }
}
