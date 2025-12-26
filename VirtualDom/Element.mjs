/**
 * Virtual DOM element creation and management utilities.
 * Provides factory functions for creating virtual DOM elements.
 * @module VirtualDom/Element
 */

import { type } from "../Util/Core.mjs";

/**
 * Processes arguments to create a virtual element structure.
 * @private
 * @param {...*} args - Arguments in various formats
 * @returns {Object} Virtual element structure with tag, attributes, children, options
 */
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

/**
 * Creates a custom vElement class with default properties.
 * @param {...*} args - Default tag, attributes, children, and options
 * @returns {Class} Custom vElement class with defaults
 * @example
 * const Button = make('button', {class: 'btn'});
 * const myButton = new Button({id: 'submit'}, ['Click me']);
 */
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

/**
 * Generates a random unique ID for virtual elements.
 * @returns {string} Random 7-character ID
 */
export function nextId() {
    return Math.random().toString(36).substring(2, 9);
}

/**
 * Virtual element class for creating virtual DOM nodes.
 * Factory for creating lightweight virtual DOM element objects.
 * @class vElement
 */
class vElement {
    /**
     * Static factory method for creating custom vElement classes.
     * @param {...*} args - Arguments for make function
     * @returns {Class} Custom vElement class
     * @static
     */
    static make() {
        return make(...arguments);
    }

    /**
     * Creates a virtual element.
     * @param {...*} args - Tag, attributes, children, and options
     * @returns {Object} Virtual element object
     */
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