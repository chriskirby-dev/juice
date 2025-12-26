/**
 * Form builder for generating form inputs from schemas and virtual DOM.
 * Provides utilities for creating labels, inputs, and mapping schema types to input types.
 * @module Form/Builder
 */

import { vElement, render } from "../VirtualDom/VirtualDom.mjs";
import { ucwords } from "../Util/String.mjs";
import { type } from "../Util/Core.mjs";

/**
 * Maps data types to HTML input types.
 * @type {Object<string, Array<string>>}
 * @private
 */
const InputTypes = {
    text: ["string", "varchar", "txt"],
    select: ["array", "set", "options"],
    number: ["int", "integer", "num", "decimal", "float", "real"],
    date: ["date", "datetime"],
    textarea: ["json", "longtext", "content"],
    hidden: ["password", "hash", "salt", "token", "key"],
};

/**
 * Builds form elements from schemas and names.
 * @class FormBuilder
 * @example
 * const input = FormBuilder.text('username', '', { type: 'text' });
 */
class FormBuilder {
    /**
     * Parses input name into structured format with ID and label.
     * @param {string} name - Input name
     * @returns {{name: string, id: string, label: string}} Parsed name data
     * @static
     */
    static parseName(name) {
        return {
            name: name,
            id: `input--${name.replace(/\_/g, "-")}`,
            label: ucwords(name.replace(/[\_\[]/g, " ").replace("]", "")),
        };
    }

    /**
     * Determines input type from schema configuration.
     * @param {Object} [schema={}] - Schema definition
     * @param {string} schema.type - Data type
     * @param {boolean} schema.readOnly - Whether field is read-only
     * @returns {string} HTML input type
     * @static
     */
    static typeFromSchema(schema = {}) {
        let type = "text";
        console.log("SChema", schema);

        if (schema.readOnly) {
            type = "hidden";
        } else if (Object.keys(InputTypes).includes(schema.type)) {
            type = schema.type;
        } else {
            for (let inputType in InputTypes) {
                if (InputTypes[inputType].includes(schema.type)) {
                    type = inputType;
                }
            }
        }
        console.log(type);
        return type;
    }

    /**
     * Creates a label virtual DOM element.
     * @param {string} inputId - Input ID to associate with
     * @param {string} label - Label text
     * @returns {Object} Virtual DOM label element
     * @static
     */
    static label(inputId, label) {
        return vElement(
            "label",
            {
                for: inputId,
            },
            [ucwords(label.replace(/\_/g, " "))]
        );
    }

    /**
     * Creates a text input virtual DOM element.
     * @param {string} name - Input name
     * @param {string} value - Initial value
     * @param {Object} [params={}] - Additional parameters
     * @param {string} [params.type='text'] - Input type
     * @param {Object} [params.events] - Event handlers
     * @returns {Object} Virtual DOM input element
     * @static
     */
    static text(name, value, params = {}) {
        name = this.parseName(name);
        const vdom = vElement("input", {
            id: name.id,
            type: params.type || "text",
            name: name.name,
            value: value,
        });
        if (params.events) vdom.events = params.events;
        return vdom;
    }

    static textarea(name, value, attributes, params) {
        name = this.parseName(name);
        if (type(value, "object")) value = JSON.stringify(value, undefined, 4);
        const vdom = vElement(
            "textarea",
            {
                id: name.id,
                name: name.name,
                ...attributes,
            },
            [value]
        );
        // if(params.events) vdom.events = params.events;
        return vdom;
    }

    static hidden(name, value, params) {
        return this.text(name, value, { type: "hidden" });
    }

    static date(name, value, params) {
        return this.text(name, value, { type: "date" });
    }

    static number(name, value, params) {
        return this.text(name, value, { type: "number" });
    }

    static select(name, value, options, params) {
        name = this.parseName(name);

        function makeOption(o) {
            if (type(o, "string")) {
                o = { value: o, label: o };
            }
            return new vElement(
                "option",
                {
                    value: o.value,
                },
                [o.label]
            );
        }

        function parseOptions(options) {
            if (Array.isArray(options)) {
                return options.map((option) => {
                    if (typeof option === "string") {
                        return makeOption({ value: option, label: option });
                    } else if (Array.isArray(option)) {
                        return makeOption({ value: option[1], label: option[0] });
                    } else {
                        return makeOption(option);
                    }
                });
            } else if (typeof options === "object") {
                return Object.entries(options).map(([label, value]) => makeOption({ value, label }));
            }
        }

        const vdom = new vElement(
            "select",
            {
                id: name.id,
                name: name.name,
            },
            parseOptions(options)
        );

        if (params.events) vdom.events = params.events;

        return vdom;
    }

    radios() {}

    checkboxes() {}

    static build(inputs) {
        return render(inputs);
    }

    static buildFromSchema(schema = {}, values = {}) {
        const inputs = [];
        for (let property in schema) {
            const inputType = this.typeFromSchema(schema[property]);
            const pschema = schema[property];
            if (this[inputType]) {
                const wrapper = { tag: "form-input", children: [] };

                const args = [property, values[property] || ""];
                const params = {};
                if (pschema.options) {
                    args.push(pschema.options);
                }
                args.push(params);
                const input = this[inputType](...args);
                console.log(input);
                if (inputType !== "hidden") wrapper.children.push(this.label(input.attributes.id, property));
                wrapper.children.push(input);
                inputs.push(wrapper);
            }
        }

        return render(inputs);
    }
}

export default FormBuilder;