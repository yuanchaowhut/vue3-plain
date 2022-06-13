export function patchStyle(el: HTMLElement, prevValue: any, nextValue: any) {
    // 样式需要比对差异 {color: 'red', fontSize: '16px'}  {color: 'blue'}
    for (let key in nextValue) {
        // @ts-ignore
        el.style[key] = nextValue[key];
    }
    if (prevValue) {
        for (let key in prevValue) {
            if (nextValue[key] === null) {
                // @ts-ignore
                el.style[key] = null;
            }
        }
    }
}
