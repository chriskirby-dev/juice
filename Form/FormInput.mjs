/**
 * Base form input class with validation and state management.
 * Provides common functionality for all form input types.
 * @module Form/FormInput
 */

import FormInputProperties from "./FormInputProperties.mjs";

/**
 * Represents a form input with validation and state tracking.
 * @class FormInput
 * @extends FormInputProperties
 * @param {string} name - Input name
 * @param {string} type - Input type
 * @example
 * const input = new FormInput('email', 'text');
 * input.value = 'user@example.com';
 */
class FormInput extends FormInputProperties {
    /**
     * Creates FormInput instance from DOM element.
     * @param {HTMLElement} element - Input element
     * @returns {FormInput} FormInput instance
     * @static
     */
    static fromDom(element) {
        const name = element.name;
        let type;
        if (element.tagName === "input") {
            type = element.type;
        }
    }

    constructor(name, type) {
        super();
        this._ = {
            savedValue: "",
        };
        this.name = name;
        this.type = type;
    }

    /**
     * Clears dirty state flag.
     * @returns {boolean} False
     */
    clean() {
        return (this._.dirty = false);
    }

    /**
     * Gets validation rules for this input.
     * @type {Array}
     */
    get rules() {
        return [];
    }

    /**
     * Validates input value against rules.
     */
    validate() {}

    /**
     * Clears input value.
     */
    clear() {
        this.value = "";
    }

    /**
     * Sets focus on input element.
     * @returns {*} Focus result
     */
    focus() {
        return this.element.focus();
    }

    /**
     * Initializes event listeners for input.
     */
    initialize() {
        this.element.addEventListener("input", (e) => {
            this.value = e.target.value;
            this._.dirty = true;
        });

        this.element.addEventListener("change", () => {
            this.value = e.target.value;
            this._.dirty = true;
        });
    }

    /**
     * Builds form input descriptor.
     * @returns {Object} Input descriptor
     */
    build() {
        const descriptor = {
            name: this.name,
            type: this.type,
        };
    }
}