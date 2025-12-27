/**
 * Form input utilities and virtual DOM builders.
 * Provides functions for creating form input elements from schemas.
 * @module Components/Form/FormInputs
 */

import { VirtualDom, vElement } from "../../VirtualDom/VirtualDom.mjs";
import Str from "../../Util/String.mjs";
import { last, first, intersect } from "../../Util/Array.mjs";
import InputName from "./InputName.mjs";

/**
 * Creates a datalist element.
 * @returns {Object} Virtual DOM datalist element
 */
export function datalist() {
    const list = vElement("datalist", {}, []);
}

const ARG_ORDER = ["type", "name", "value"];
const OBJ_ARG_ORDER = ["attributes", "options"];
const INPUT_TYPES = ["text", "textarea", "checkbox", "radio", "select"];
//form("name", {}, [input()]);
function conformParams(...args) {
    let params = {};
    if (args.length > 1) {
        const obj_args = args.filter((arg) => arg instanceof Object);
        for (let o = 0; o < obj_args.length; o++) {
            params[OBJ_ARG_ORDER[o]] = obj_args[o];
        }

        const text_args = args.filter((arg) => !(arg instanceof Object));
        for (let t = 0; t < text_args.length; t++) {
            params[ARG_ORDER[t]] = text_args[t];
        }
    } else {
        params = args[0];
    }

    const name = new InputName(params.name);
    const { type, attributes = {}, value = "" } = params;
    attributes.name = name;

    const attributedProps = intersect(ATTTRIBUTED_PROPERTIES, Object.keys(params));
    for (let prop of attributedProps) {
        //Shift Property to Attributes
        if (attributes[prop] !== undefined) continue;
        attributes[prop] = params[prop];
        delete params[prop];
    }

    if (!attributes.id) attributes.id = name.toId();
    if (!params.hasOwnProperty("label")) params.label = name.toLabel();

    return params;
}

export function form(name, attributes = {}, children = []) {
    return vElement("form", attributes, children);
}

export function input(children) {
    const params = conformParams(...args);
    const attrs = {
        class: `form-input ${type}`,
    };
    return vElement("div", attrs, children);
}

export function fieldset(legend, children) {
    return vElement("fieldset", {}, [vElement("legend", {}, [legend]), ...children]);
}

export function checkbox(...args) {
    const properties = conformParams(["checkbox", ...args]);
    const { attributes = {} } = properties;
    return vElement(
        "label",
        {
            for: attributes.id,
        },
        [vElement("span", {}, [properties.label]), vElement("input", attributes)]
    );
}

export function radio(...args) {
    const properties = conformParams(["radio", ...args]);
    const { attributes = {} } = properties;
    return vElement(
        "label",
        {
            for: attributes.id,
        },
        [vElement("span", {}, [properties.label]), vElement("input", attributes)]
    );
}

export function select(...args) {
    const { attributes = {}, options = {}, label, value = "" } = conformParams(["select", ...args]);

    const vOptions = [];
    if (Array.isArray(options)) {
        for (let i = 0; i < options.length; i++) {
            const attrs = {
                value: options[i],
            };
            if (attrs.value === value) {
                attrs.selected = "";
            }
            vOptions.push(vElement("option", attrs, [options[i]]));
        }
    } else if (typeof options === "object") {
        for (let key in options) {
            const attrs = {
                value: options[key],
            };
            if (attrs.value === value) {
                attrs.selected = "";
            }
            vOptions.push(vElement("option", attrs, [key]));
        }
    }

    return [vElement("label", { for: attributes.id }, [label]), vElement("select", attributes, vOptions)];
}

export function textarea(...args) {
    const properties = conformParams(["textarea", ...args]);
    const { label, value = "", attributes = {} } = properties;
    return [vElement("label", { for: attributes.id }, [label]), vElement("textarea", attributes, [value])];
}

export function text(...args) {
    const properties = conformParams(["text", ...args]);
    const { label, attributes = {} } = properties;
    return [vElement("label", { for: attributes.id }, [label]), vElement("input", attributes)];
}

export function hidden(...args) {
    const properties = conformParams(["hidden", ...args]);
    const { attributes = {} } = properties;
    return vElement("input", attributes);
}

const ATTTRIBUTED_PROPERTIES = [
    "type",
    "value",
    "name",
    "placeholder",
    "checked",
    "disabled",
    "required",
    "readonly",
    "min",
    "max",
];

class FormInputs {
    static fromSchema(name, properties) {
        let input;
        name = new InputName(name);
        const { type, attributes = {}, value = "" } = properties;
        attributes.name = name;

        const attributedProps = intersect(ATTTRIBUTED_PROPERTIES, Object.keys(properties));
        for (let prop of attributedProps) {
            //Shift Property to Attributes
            if (attributes[prop] !== undefined) continue;
            attributes[prop] = properties[prop];
            delete properties[prop];
        }

        if (!attributes.id) attributes.id = name.toId();
        if (!properties.hasOwnProperty("label")) properties.label = name.toLabel();

        if (FormInputs[type]) {
            input = FormInputs[type](name, value, attributes, properties);
        } else {
            input = FormInputs.input(type, name, value, attributes, properties);
        }

        return input;
    }

    static datalist(id, options = []) {
        return vElement(
            "datalist",
            {
                id: id,
            },
            []
        );
    }

    static hidden(name, value, attributes = {}) {
        return vElement("input", attributes);
    }

    static options(type, name, value, attributes, options = []) {
        let container;

        if (type == "select") {
            container = vElement("select", attributes, []);
        }

        for (let i = 0; i < options.length; i++) {
            container.children.push(vElement("option", { value: options[i] }, [options[i]]));
        }

        return container;
    }

    static select(name, value, attributes = {}, properties) {
        return this.options("select", name, value, attributes, properties.options);
    }

    static checkbox(name, value, attributes = {}, properties = {}) {
        if (attributes.checked === false) delete attributes.checked;
        return vElement(
            "label",
            {
                for: attributes.id,
            },
            [vElement("span", {}, [properties.label]), vElement("input", attributes)]
        );
    }

    static checkboxes(name, values, attributes = {}) {
        const wrapper = vElement("div", {}, []);
        for (let i = 0; i < values.length; i++) {
            wrapper.children.push(this.checkbox(`${name}[]`, values[i]));
        }
        return wrapper;
    }

    static radio(name, value, attributes = {}, properties = {}) {
        return vElement(
            "label",
            {
                for: attributes.id,
            },
            [vElement("span", {}, [properties.label || FormInputs.nameToLabel(name)]), vElement("input", attributes)]
        );
    }

    static number(name, value, attributes = {}, properties = {}) {
        return vElement("input", attributes);
    }

    static text(name, value, attributes = {}) {
        attributes.name = name;
        attributes.value = value;
        return this.input("text", attributes, value);
    }

    static textarea(name, value, attributes = {}, properties = {}) {
        delete attributes.value;
        return vElement(
            "textarea",
            {
                id: FormInputs.nameToId(name),
                type,
                name,
            },
            [value]
        );
    }

    static range(name, value, attributes = {}, options = {}) {
        return this.input("range", name, value, attributes, options);
    }

    static date(name, value, attributes = {}) {
        attributes.name = name;
        attributes.value = value;
        return this.input("date", attributes);
    }

    static datetime(name, value, attributes = {}) {
        attributes.name = name;
        attributes.value = value;
        return this.input("datetime", attributes);
    }

    static input(type, name, value, attributes = {}, options = {}) {
        return [
            vElement("label", { for: attributes.id }, [options.label || name.toLabel()]),
            vElement("input", attributes, [], null, options),
        ];
    }

    static submit(text = "Submit", attributes = {}) {
        attributes.type = "submit";
        attributes.value = text;
        return this.input("submit", attributes);
    }

    static fromObjectDescriptor(descriptor) {}
}

export default FormInputs;