import Observe from "./Observe/Observe.mjs";

const NODE_TYPES = [
    null,
    "ELEMENT_NODE",
    "TEXT_NODE",
    "CDATA_SECTION_NODE",
    "PROCESSING_INSTRUCTION_NODE",
    "COMMENT_NODE",
    "DOCUMENT_NODE",
    "DOCUMENT_TYPE_NODE",
    "DOCUEMNT_FRAGMENT_NODE",
];

const observables = ["resize", "childList"];

const customMethods = {};

class ElementExtend {
    node;

    constructor(node) {
        this.node = node;
        if (Object.keys(customMethods).length) {
            Object.keys(customMethods).forEach((method) => this.assignMethod(method, customMethods[method]));
        }
    }

    assignMethod(name, fn) {
        this[name] = fn.bind(this);
    }

    get inShadow() {
        return this.node.getRootNode().host ? true : false;
    }

    get shadowHost() {
        return this.node.getRootNode().host;
    }

    get customParent() {
        if (this.node.parentNode?.tagName.includes("-")) {
            return this.node.parentNode;
        } else if (this.shadowHost?.tagName.includes("-")) {
            return this.shadowHost;
        } else {
            return null;
        }
    }

    dispatch(event) {
        this.node.dispatchEvent(new Event(event));
    }

    dispatchCustom(customEvent, detail) {
        this.node.dispatchEvent(new CustomEvent(customEvent, { detail: detail }));
    }

    append(nodeList) {
        if (typeof nodeList == "array") {
            nodeList.forEach((node) => this.node.appendChild(node));
        } else {
            this.node.appendChild(nodeList);
        }
    }

    after(newNode) {
        if (this.node.nextSibling) {
            this.node.parentElement.insertBefore(newNode, this.node.nextSibling);
        } else {
            this.node.parentElement.appendChild(newNode);
        }
        return this;
    }

    before(newNode) {
        this.node.parentNode.insertBefore(newNode, this.node);
        return this;
    }

    insertHTML(html, position = "beforeend") {
        this.node.insertAdjacentHTML(html, position);
        return this;
    }

    observe(type, callback) {
        const observer = Observe[type](this.node);
        if (callback) {
            return observer.then(callback);
        } else {
            return observer;
        }
    }

    on(events, fn, bubble = false) {
        if (!type(events, "array")) events = [events];
        events.forEach((event) => {
            if (observables.includes(event)) {
                const ob = Observer[event](this.node, fn);
                return;
            }

            this.node.addEventListener(
                event,
                (e) => {
                    const args = [e];
                    if (e instanceof CustomEvent) {
                        args.push(e.detail);
                    }
                    return fn.apply(this.node, args);
                },
                bubble
            );
        });

        return this;
    }

    emit(event, data) {
        this.node.dispatchEvent(new CustomEvent(event, { detail: data }));
        return this;
    }

    first(selector) {
        return this.node.querySelector(selector);
    }

    all(selector) {
        return this.node.querySelectorAll(selector);
    }

    exists(selector) {
        return this.node.querySelector(selector) ? true : false;
    }

    find(selector) {
        return this.node.querySelector(selector);
    }

    findParent(selector, boundary = document.body) {
        if (typeof boundary == "string") boundary = document.querySelector(boundary);
        let current = this.node;
        let found;
        while (!found && current.parentNode && current.parentNode !== document.body) {
            if (current.parentNode === boundary) {
                found = boundary;
                break;
            } else if (current.parentNode === document.body) {
                found = document.body;
                break;
            } else if (
                current.parentNode.parentNode &&
                current.parentNode.parentNode.querySelector(selector) === current.parentNode
            ) {
                found = current.parentNode;
                break;
            }
            current = current.parentNode;
        }
        return found;
    }

    parents(boundary = document.body) {
        const parents = [];
        var target = this.node;
        if (target === boundary) return [];
        while (target.parentNode && target.parentNode !== boundary) {
            target = target.parentNode;
            parents.push(target);
        }
        return parents;
    }

    get siblings() {
        var current = this.node;
        let nextSibling = current.nextElementSibling;
        let prevSibling = current.previousElementSibling;
        const siblings = [];

        while (prevSibling) {
            siblings.push(prevSibling);
            prevSibling = prevSibling.previousElementSibling;
        }

        siblings.reverse();

        while (nextSibling) {
            siblings.push(nextSibling);
            nextSibling = nextSibling.nextElementSibling;
        }

        return siblings;
    }

    clone() {
        return this.node.cloneNode(true);
    }

    computed(prop = null) {
        var style = window.getComputedStyle(this.node, null);
        return prop ? style.getPropertyValue(prop) : style;
    }

    get prev() {
        let { node } = this;
        const root = document.body;
        let newNode = node.lastChild || node.previousSibling;
        if (newNode) return newNode;

        if (node === root) return null;

        while (node.parentNode) {
            node = node.parentNode;
            if (node === root) return null;
            if (node.previousSibling) return node.previousSibling;
        }

        return null;
    }

    get next() {
        let { node } = this;
        let root = document.body;
        if (!node) return false;
        root = root || document.body;
        let newNode = node.firstChild || node.nextSibling;
        if (newNode) return newNode;

        if (node === root) return null;

        while (node.parentNode) {
            node = node.parentNode;
            if (node === root) return null;
            if (node.nextSibling) return node.nextSibling;
        }

        return null;
    }

    rect() {
        let { top, right, bottom, left, width, height, x, y } = this.node.getBoundingClientRect();
        return { top, right, bottom, left, width, height, x, y };
    }

    docRect() {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
        let { top, right, bottom, left, width, height, x, y } = this.node.getBoundingClientRect();

        top = y = top + scrollTop;
        left = x = left + scrollLeft;

        return { top, right, bottom, left, width, height, x, y };
    }

    get class() {
        const node = this.node;
        return {
            name: function () {
                return node.className;
            },
            add: function (className) {
                node.classList.add(className);
                return this;
            },
            remove: function (className) {
                node.classList.remove(className);
                return this;
            },
            toggle: function (className, force = null) {
                node.classList.toggle(className, force);
                return this;
            },
            has: function (className) {
                return node.classList.contains(className);
            },
        };
    }

    attr(name, value) {
        if (value === false) {
            this.node.removeAttribute(name);
        }
        if (value) return this.node.setAttribute(name, value);
        return this.node.getAttribute(name) || null;
    }

    hasAttr(name) {
        return this.node.hasAttribute(name);
    }

    get attrs() {
        const attrs = {};

        for (var i = 0, atts = this.node.attributes, n = atts.length, arr = []; i < n; i++) {
            attrs[atts[i].nodeName] = atts[i].value;
        }

        return attrs;
    }

    vdom(node = this.node) {
        const tagName = node.tagName.toLowerCase();
        const attrs = {};

        for (var i = 0, atts = node.attributes, n = atts.length, arr = []; i < n; i++) {
            attrs[atts[i].nodeName] = atts[i].value;
        }

        const children = Array.prototype.slice.call(node.childNodes).map((cnode) => this.vdom(cnode));

        const vElem = Object.create(null);

        Object.assign(vElem, {
            tagName,
            attrs,
            children,
        });

        return vElem;
    }

    get width() {
        return this.node.clientWidth;
    }

    get height() {
        return this.node.clientHeight;
    }

    remove() {
        this.node.parentNode.removeChild(this.node);
    }

    fx(type, ...args) {
        console.log("FX", type, args);
        Effects[type](this.node, ...args);
        return this;
    }
}

class ListExtend {
    node;
    constructor(node) {
        this.node = node;
    }
}

Object.defineProperty(HTMLElement.prototype, "$", {
    get: function () {
        if (!this._$) this._$ = new ElementExtend(this);
        return this._$;
    },
    set: function () {
        return false;
    },
});

Object.defineProperty(Node.prototype, "$", {
    get: function () {
        if (!this._$) this._$ = new ElementExtend(this);
        return this._$;
    },
    set: function () {},
});

/*
Object.defineProperty (HTMLCollection.prototype, '$', {
    get: function(){
        if(!this._$) this._$ = new ListExtend(this);
        return this._$;
    },
    set: function(){
        return false;
    }
});


Object.defineProperty(NodeList.prototype, '$', {
    get: function(){
        if(!this._$) this._$ = new ListExtend(this);
        return this._$;
    },
    set: function(){
        
    }
});
*/

class DomExtend {
    method(name, fn) {
        customMethods[name] = fn;
    }
}

export default DomExtend;
