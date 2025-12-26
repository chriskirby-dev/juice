/**
 * DOM tree parsing and manipulation utilities.
 * Provides functions to convert DOM elements to virtual DOM representation and vice versa.
 * @module Dom/Tree
 */

/**
 * Recursively parses a DOM element tree into a virtual DOM representation.
 * Handles elements, text nodes, comments, and document fragments with namespace support.
 * @param {Node} element - The DOM element to parse
 * @param {string} [namespace] - Optional XML namespace
 * @returns {Object|string|Array|null} Virtual DOM object, text content, array of children, or null for comments
 * @example
 * const vdom = parseDomTree(document.body);
 * // Returns: { tag: 'body', attributes: {...}, children: [...] }
 */
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

/**
 * Represents a DOM tree with utilities for virtual DOM conversion.
 * @class DomTree
 * @param {HTMLElement} root - The root element of the DOM tree
 * @example
 * const tree = new DomTree(document.body);
 * const vdom = tree.toVDom(document.querySelector('.container'));
 */
class DomTree {
    /** @type {HTMLElement} The root element of the tree */
    root;
    
    /**
     * Creates a new DomTree instance.
     * @param {HTMLElement} root - The root element
     */
    constructor(root) {
        this.root = root;
    }

    /**
     * Converts an element to virtual DOM representation.
     * @param {HTMLElement} element - The element to convert
     * @param {string} [namespace] - Optional XML namespace
     * @returns {Object} Virtual DOM representation
     */
    toVDom(element, namespace) {
        return parseDomTree(element, namespace);
    }
}

export default DomTree;