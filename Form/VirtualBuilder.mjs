/**
 * Virtual form builder for creating form elements from structured data.
 * @module Form/VirtualBuilder
 */
import { VirtualDom, vElement } from "../VirtualDom/VirtualDom.mjs";
import Str from "../Util/String.mjs";
import { last, first, intersect } from "../Util/Array.mjs";
import InputName from "./InputName.mjs";
import { render as _render } from "../VirtualDom/VirtualDom.mjs";

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
    "size",
    "maxlength",
    "style",
    "step",
];

const ARG_ORDER = ["type", "name", "value"];
const OBJ_ARG_ORDER = ["attributes", "options"];
const INPUT_TYPES = ["text", "textarea", "checkbox", "radio", "select"];

const VFORM = {
    itorators: {
        rows: 0,
    },
};

export const vdom = function (...args) {
    return new vElement(...args);
};

/**
 * Conform parameters to a standard format.
 *
 * This function takes an arbitrary number of arguments, and returns an object
 * with the following properties:
 *
 * - type: The type of the input element.
 * - attributes: An object containing the attributes of the element.
 * - value: The value of the element.
 * - label: The label of the element.
 *
 * The function first checks if the arguments are in the correct order. If not,
 * it tries to find the correct order by checking the types of the arguments.
 * If the arguments are in the correct order, it sets the properties of the
 * returned object accordingly.
 *
 * If the arguments are not in the correct order, it tries to find the correct
 * order by checking the types of the arguments. If the arguments are not in
 * the correct order, it throws an error.
 *
 * @param {...*} args
 * @returns {Object}
 */
function conformParams(...args) {
    let params = {};

    if (args.length > 1) {
        const objArgs = args.filter((arg) => arg instanceof Object);
        const textArgs = args.filter((arg) => !(arg instanceof Object));

        if (objArgs.length > 2) {
            params = last(objArgs);
            params.attributes = objArgs.shift();
            params.options = objArgs.shift();
        } else if (objArgs.length > 1) {
            params = last(objArgs);
            params.attributes = first(objArgs);
        } else {
            params = first(objArgs);
        }

        for (let i = 0; i < textArgs.length; i++) {
            params[ARG_ORDER[i]] = textArgs[i];
        }
    } else {
        params = args[0];
    }

    const { attributes = {}, ...rest } = params;
    const name = new InputName(params.name);
    attributes.name = name.toString();
    const field = { classes: [] };

    const attributedProps = intersect(ATTTRIBUTED_PROPERTIES, Object.keys(rest));

    for (const prop of attributedProps) {
        if (attributes[prop] !== undefined) continue;
        attributes[prop] = rest[prop];
        //delete rest[prop];
    }
    if (!attributes.classes) attributes.classes = [];
    if (attributes.class) attributes.classes.push(attributes.class);
    if (params.inline) {
        attributes.classes.push("inline");
        field.classes.push("inline");
    }
    if (params.labelInline) {
        attributes.classes.push("label-inline");
        field.classes.push("label-inline");
    }

    if (!attributes.id) attributes.id = name.toId();
    if (!rest.hasOwnProperty("label")) rest.label = name.toLabel();

    if (field.classes.length > 0) field.class = field.classes.join(" ");
    if (attributes.classes.length > 0) attributes.class = attributes.classes.join(" ");

    delete attributes.classes;
    delete field.classes;

    if (Object.keys(field).length > 1) attributes.field = field;

    return { ...rest, attributes };
}

/**
 * Creates a form element.
 *
 * @param {string} name - The name attribute of the form element.
 * @param {Object} attributes - Additional attributes to apply to the form element.
 * @param {Array<Object>} children - Child elements of the form.
 * @returns {Object} The form element.
 */
export function form(name, attributes = {}, children = []) {
    return new vElement("form", attributes, children);
}

export function container(attributes = {}, children = []) {
    return new vElement("div", attributes, children);
}

export function row(label, children, params = {}) {
    const content = [];
    VFORM.itorators.rows++;
    const id = `row-${VFORM.itorators.rows}`;
    if (Array.isArray(label)) {
        children = label;
        label = null;
    }

    if (label) {
        children.unshift(new vElement("label", { for: id, class: "row-label" }, [label]));
    }

    content.push(new vElement("div", { id, class: `row ${params.inline ? "inline" : ""}` }, children));

    return content;
}

export function vector(name, values = [], labels = [], properties = {}) {
    const inputs = [];
    const subs = ["x", "y", "z", "w"];
    for (let i = 0; i < values.length; i++) {
        const input = number(`${name}[${subs[i]}]`, values[i], {
            label: labels[i] || "X",
            labelInline: true,
            min: -1,
            max: 1,
            step: 0.001,
            inline: true,
        });
        inputs.push(input);
    }

    return new vElement("div", { class: "vector" }, [row(properties.label || "", inputs)]);
}

/**
 * Creates an input element.
 *
 * @param {Array<Object>} children - Child elements of the input.
 * @returns {Object} The input element.
 */
export function input(children, properties, options = {}) {
    if (!Array.isArray(children)) {
        children = [children];
    }
    const type = properties.type || "text";

    const attrs = {
        class: `input ${type}`,
    };

    return new vElement("div", attrs, children, options);
}

export function wrap(type, children, properties = {}) {
    const attributes = {
        class: `form-input ${type} ${properties.inline ? "inline" : ""}${
            properties.labelInline ? " label-inline" : ""
        }`,
    };
    if (properties.field) {
        const field = properties.field;
        attributes.class += field.class ? ` ${field.class}` : "";
        delete properties.field;
    }

    return new vElement("div", attributes, children);
}

/**
 * Creates a fieldset element.
 *
 * @param {string} legend - The legend to display with the fieldset.
 * @param {Array<Object>} children - Child elements of the fieldset.
 * @returns {Object} The fieldset element.
 */
export function fieldset(legend, children) {
    return new vElement("fieldset", {}, [new vElement("legend", {}, [legend]), ...children]);
}

/**
 * Creates a checkbox element.
 *
 * @param {string} label - The label to display for the checkbox.
 * @param {Object} attributes - Additional attributes to apply to the checkbox element.
 * @returns {Object} The checkbox element.
 */
export function checkbox(...args) {
    const properties = conformParams(...["checkbox", ...args]);

    const { attributes = {} } = properties;
    attributes.type = "checkbox";
    return new vElement(
        "label",
        {
            for: attributes.id,
            class: `form-input radio ${properties.inline ? "inline" : ""}`,
            ...(attributes.field || {}),
        },
        [new vElement("span", {}, [properties.label]), new vElement("input", attributes)]
    );
}

/**
 * Creates a radio button element.
 *
 * @param {string} label - The label to display for the radio button.
 * @param {Object} attributes - Additional attributes to apply to the radio button element.
 * @returns {Object} The radio button element.
 */
export function radio(...args) {
    const properties = conformParams(...["radio", ...args]);
    const { attributes = {} } = properties;
    attributes.type = "radio";
    return new vElement(
        "label",
        {
            for: attributes.id,
            class: `form-input radio ${properties.inline ? "inline" : ""}`,
            ...(attributes.field || {}),
        },
        [new vElement("span", {}, [properties.label]), new vElement("input", attributes)]
    );
}

export function radios({ label, name, options = {}, attributes = {} }) {
    const values = Object.keys(options).map((key, i) =>
        radio({ name: name, label: key, value: options[key], attributes: { class: "inline" } })
    );

    return new vElement("div", attributes, [
        new vElement("label", { for: attributes.id }, [label]),
        wrap("radios", values),
    ]);
}

/**
 * Creates a select element.
 *
 * @param {string} label - The label to display for the select element.
 * @param {Object} options - The options for the select element. This can be an array of string values or an object with key-value pairs where the key is the label and the value is the value of the option.
 * @param {Object} attributes - Additional attributes to apply to the select element.
 * @param {string} value - The value of the select element.
 * @returns {Object} The select element.
 */
export function select({ label, options = [], attributes = {}, value = "", events = {} }) {
    const vOptions = [];
    if (Array.isArray(options)) {
        for (const option of options) {
            const attrs = {
                value: option,
            };
            if (attrs.value === value) {
                attrs.selected = "";
            }
            vOptions.push(new vElement("option", attrs, [option]));
        }
    } else if (typeof options === "object") {
        for (const key in options) {
            const attrs = {
                value: options[key],
            };
            if (attrs.value === value) {
                attrs.selected = "";
            }
            vOptions.push(new vElement("option", attrs, [key]));
        }
    }

    return wrap(
        "select",
        [
            new vElement("label", { for: attributes.id }, [label]),
            input(new vElement("select", attributes, vOptions), { attributes }, { events }),
        ],
        {}
    );
}

/**
 * Creates a textarea element.
 *
 * @param {string} label - The label to display for the textarea element.
 * @param {Object} attributes - Additional attributes to apply to the textarea element.
 * @param {string} value - The value of the textarea element.
 * @returns {Object[]} An array of two elements: the label and the textarea.
 */
export function textarea(...args) {
    const properties = conformParams(...["textarea", ...args]);
    const { label, value = "", attributes = {} } = properties;

    return wrap(
        "textarea",
        [new vElement("label", { for: attributes.id }, [label]), new vElement("textarea", attributes, [value])],
        properties
    );
}

/**
 * Creates a text input element.
 *
 * @param {string} label - The label to display for the text input element.
 * @param {Object} attributes - Additional attributes to apply to the text input element.
 * @returns {Object[]} An array of two elements: the label and the text input.
 */
export function text(...args) {
    const properties = conformParams(...["text", ...args]);
    const { label, attributes = {} } = properties;
    return wrap(
        "text",
        [new vElement("label", { for: attributes.id }, [label]), input(new vElement("input", attributes), properties)],
        properties
    );
}

export function number(...args) {
    const properties = conformParams(...["number", ...args]);
    const { label, attributes = {} } = properties;
    attributes.type = "number";
    if (attributes.size) {
        attributes.style = `width: ${attributes.size}px;`;
    }
    return wrap(
        "number",
        [new vElement("label", { for: attributes.id }, [label]), input(new vElement("input", attributes), properties)],
        properties
    );
}

export function range(...args) {
    const properties = conformParams(...["range", ...args]);
    const { label, attributes = {} } = properties;
    return wrap(
        "range",
        [new vElement("label", { for: attributes.id }, [label]), input(new vElement("input", attributes), properties)],
        properties
    );
}

/**
 * Creates a hidden input element.
 *
 * @param {Object} attributes - Additional attributes to apply to the hidden input element.
 * @returns {Object} The hidden input element.
 */
export function hidden(...args) {
    const properties = conformParams(...["hidden", ...args]);
    const { attributes = {} } = properties;
    return new vElement("input", attributes);
}

export function render(vdom) {
    return _render(vdom);
}

let bi = 0;
export function button(label, attributes, fn) {
    attributes.class = "button";
    attributes.href = "#";
    attributes.onclick = juice.registerEvent("form_button_" + bi, fn);
    bi++;
    return new vElement("a", attributes, [label], { events: { click: fn } });
}