import Parser from "./Parser.mjs";
import { default as _render, updateElement, renderWithRefs } from "./Render.mjs";
import { default as Element } from "./Element.mjs";
import diff from "./Diff.mjs";
import Util from "../Util/Core.mjs";

function vElementArgs(...args) {
    const el = { tag: "div", attributes: {}, children: [], options: {} };
    if (args.length === 1 && Util.type(args[0], "object")) return args[0];

    let foundAttrs = false;
    let foundChildren = false;

    args.forEach((arg) => {
        if (Util.type(arg, "string")) {
            el.tag = arg;
        } else if (Util.type(arg, "object") && !foundAttrs) {
            el.attributes = arg;
            foundAttrs = true;
        } else if (Util.type(arg, "array") && !foundChildren) {
            el.children = arg;
            foundChildren = true;
        } else if (Util.type(arg, "object")) {
            el.options = arg;
        }
    });

    return el;
}

export class vElement {
    static make(...args) {
        const defaults = vElementArgs(...args);
        return class extends vElement {
            constructor(...args) {
                const params = vElementArgs(...args);
                super(
                    defaults.tag || params.tag,
                    Object.assign({}, defaults.attributes, params.attributes),
                    defaults.children.concat(params.children),
                    Object.assign({}, defaults.options, params.options)
                );
            }
        };
    }

    constructor(...args) {
        const params = vElementArgs(...args);
        const { tag, attributes, children, options } = params;

        const vElem = Object.create(null);

        return Object.assign(vElem, {
            tag,
            attributes,
            children,
            options,
        });
    }
}

export const div = vElement.make("div");

export function render(vdom) {
    return _render(vdom);
}

export class VirtualDom {
    static element = vElement;

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

    static Element = vElement;
}

export default VirtualDom;
