import { type } from "../Util/Core.mjs";

function vElementArgs(...args) {
    const el = { tag: "div", attributes: {}, children: [], options: {} };
    if (args.length === 1 && type(args[0], "object")) return args[0];

    let foundAttrs = false;
    let foundChildren = false;

    args.forEach((arg) => {
        if (type(arg, "string")) {
            el.tag = arg;
        } else if (type(arg, "object") && !foundAttrs) {
            el.attributes = arg;
            foundAttrs = true;
        } else if (type(arg, "array") && !foundChildren) {
            el.children = arg;
            foundChildren = true;
        } else if (type(arg, "object")) {
            el.options = arg;
        }
    });

    return el;
}

export function make(...args) {
    const defaults = vElementArgs(...args);
    return class CustomElement extends vElement {
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

export function nextId() {
    return Math.random().toString(36).substring(2, 9);
}

class vElement {
    static make() {
        return make(...arguments);
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

export default vElement;