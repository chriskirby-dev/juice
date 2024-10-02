import Parser from "./Parser.mjs";
import { default as _render, updateElement, renderWithRefs } from "./Render.mjs";
import { default as Element } from "./Element.mjs";
import diff from "./Diff.mjs";
import Util from "../Util/Core.mjs";

function fromArgs(...args) {
    const el = { tag: "div" };
    let foundAttrs = false;
    let ns = null;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (Util.type(arg, "string")) {
            el.tag = arg;
        } else if (Util.type(arg, "array")) {
            el.children = arg;
        } else if (Util.type(arg, "object")) {
            if (!foundAttrs) {
                foundAttrs = true;
                el.attributes = arg;
            } else {
                el.options = arg;
            }
        }
    }
    return Element(el.tag, el.attributes || {}, el.children || [], ns, el.options || {});
}

export function div(...args) {
    return fromArgs("div", ...args);
}

export function vElement(...args) {
    return fromArgs(...args);
}

export function render(vdom) {
    return _render(vdom);
}

export class VirtualDom {
    static element(...args) {
        return fromArgs(...args);
    }

    static el(...args) {
        return this.element(...args);
    }

    static create(vdom) {
        return _render(vdom);
    }

    static render(vdom) {
        return _render(vdom);
    }

    static renderWithRefs(vdom) {
        return renderWithRefs(vdom);
    }

    static toHTML(vdom) {
        let _tmp = document.createElement("div");
        _tmp.appendChild(_render(vdom));
        const html = _tmp.innerHTML;
        _tmp = null;
        return html;
    }

    static update(dom, vNew, vOld) {
        return updateElement(dom, vNew, vOld);
    }

    static diff(vOld, vNew) {
        return diff(vOld, vNew);
    }

    static parse(content) {
        return Parser.parse(content);
    }

    static parseHTML(element) {
        return Parser.fromHTML(element);
    }

    static parseDom(element) {
        return Parser.fromDom(element);
    }

    static Element = Element;
}

export default VirtualDom;
