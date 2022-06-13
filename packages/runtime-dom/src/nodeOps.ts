export const nodeOps = {
    // 增加
    createElement(tagName: string) {
        return document.createElement(tagName);
    },
    createText(text: string) {
        return document.createTextNode(text);
    },
    insert(child: Node, parent: Node, anchor = null) {
        // 当anchor为null时insertBefore等价于 appendChild
        parent.insertBefore(child, anchor);
    },
    // 删除
    remove(child: Node) {
        const parentNode = child.parentNode;
        if (parentNode) {
            parentNode.removeChild(child);
        }
    },
    // 修改
    // 设置元素中的内容
    setElementText(el: HTMLElement, text: string) {
        el.textContent = text;
    },
    // 设置文本节点
    setText(node: Node, text: string) {
        node.nodeValue = text;
    },
    // 查询
    querySelector(selector: string) {
        return document.querySelector(selector);
    },
    parentNode(node: Node) {
        return node.parentNode;
    },
    nextSibling(node: Node) {
        return node.nextSibling;
    },
}
