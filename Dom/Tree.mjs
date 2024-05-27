export function parseDomTree(element, namespace) {
    // Skip comments
    if (element.nodeType === Node.COMMENT_NODE) {
        return null;
    }

    // Handle text nodes
    if (element.nodeType === Node.TEXT_NODE) {
        return element.textContent;
    }

    // Handle document fragments
    if (element.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        return Array.from(element.children).map((child) => parseDomTree(child, namespace));
    }

    // Handle other node types
    const tag = element.tagName.toLowerCase();
    const attributes = Array.from(element.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
    }, {});

    const children = Array.from(element.childNodes)
        .map((child) => parseDomTree(child, namespace))
        .filter((n) => n !== null);

    const vdom = {
        tag,
        attributes,
        children,
    };

    if (namespace) {
        vdom.ns = namespace;
    } else if (element.namespaceURI !== "http://www.w3.org/1999/xhtml") {
        vdom.ns = element.namespaceURI;
    }

    return vdom;
}

class DomTree {
    root;
    constructor(root) {
        this.root = root;
    }

    toVDom(element, namespace) {
        return parseDomTree(element, namespace);
    }
}

export default DomTree;
