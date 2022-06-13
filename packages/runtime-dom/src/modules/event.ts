import {FuncType} from "@vue/shared";

function createInvoker(callback: FuncType) {
    const invoker = (e: any) => invoker.value(e);
    invoker.value = callback;
    return invoker;
}

export function patchEvent(el: HTMLElement, eventName: string, nextValue: any) {
    // 可以先移除掉事件，再重新绑定
    let invokers = el._vei || (el.vei = {});
    let exist = invokers[eventName];

    if (exist) {
        if (nextValue) {
            invokers[eventName].value = nextValue;
        } else {
            el.removeEventListener(eventName.slice(2).toLowerCase(), exist);
            invokers[eventName] = undefined;
        }
    } else {
        let event = eventName.slice(2).toLowerCase();  // onClick => click
        if (nextValue) {
            const invoker = invokers[eventName] = createInvoker(nextValue);
            el.addEventListener(event, invoker);
        }
    }
}
