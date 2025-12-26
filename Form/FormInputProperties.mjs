import { Emitter } from "../Event/Event.mjs";

class FormInputProperties extends Emitter {
    /**
     * @typedef {Object} FormInputProperties~Private
     * @property {boolean} dirty
     * @property {string} value
     * @property {boolean} disabled
     * @property {string[]} errors
     * @property {boolean} required
     * @property {boolean} readonly
     * @property {string} placeholder
     * @property {boolean} autofocus
     */

    constructor() {
        super();
        this._ = { dirty: false, errors: [], formatting: [] };
        this.element = null;
    }

    /**
     * Whether the value of the input has changed since the last time it was validated.
     *
     * @type {boolean}
     */
    get dirty() {
        return this._.dirty;
    }

    /**
     * The current value of the input.
     *
     * @type {string}
     */
    get value() {
        return this._.value;
    }

    /**
     * Set the value of the input.
     *
     * @param {string} value
     */
    set value(value) {
        if (value === this.element.value) return;
        if (this.element) {
            this.element.value = value;
            this.element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
        }
        this._.dirty = true;
        this._.value = value;
    }

    /**
     * Whether the input is disabled.
     *
     * @type {boolean}
     */
    get disabled() {
        return this.element.hasAttribute("disabled");
    }

    /**
     * Disable the input.
     */
    disable() {
        this.element.setAttribute("disabled", "");
        this._.disabled = true;
    }

    /**
     * Enable the input.
     */
    enable() {
        this.element.removeAttribute("disabled");
        this._.disabled = false;
    }

    /**
     * Whether the input is required.
     *
     * @type {boolean}
     */
    get required() {
        return this.element.hasAttribute("required");
    }

    /**
     * Set whether the input is required.
     *
     * @param {boolean} isRequired
     */
    set required(isRequired) {
        isRequired ? this.element.setAttribute("required", "") : this.element.removeAttribute("required");
        this._.required = isRequired;
    }

    /**
     * Whether the input is readonly.
     *
     * @type {boolean}
     */
    get readonly() {
        return this.element.hasAttribute("readonly");
    }

    /**
     * Set whether the input is readonly.
     *
     * @param {boolean} isReadonly
     */
    set readonly(isReadonly) {
        isReadonly ? this.element.setAttribute("readonly", "") : this.element.removeAttribute("readonly");
        this._.readonly = isReadonly;
    }

    /**
     * The placeholder of the input.
     *
     * @type {string}
     */
    get placeholder() {
        return this.element.getAttribute("placeholder") || "";
    }

    /**
     * Set the placeholder of the input.
     *
     * @param {string} placeholder
     */
    set placeholder(placeholder) {
        this.element.setAttribute("placeholder", placeholder);
        this._.placeholder = placeholder;
    }

    /**
     * Whether the input has autofocus enabled.
     *
     * @type {boolean}
     */
    get autofocus() {
        return this.element.hasAttribute("autofocus");
    }

    /**
     * Set whether the input has autofocus enabled.
     *
     * @param {boolean} isAutofocus
     */
    set autofocus(isAutofocus) {
        isAutofocus ? this.element.setAttribute("autofocus", "") : this.element.removeAttribute("autofocus");
        this._.autofocus = isAutofocus;
    }

    /**
     * The errors associated with the input.
     *
     * @type {string[]}
     */
    get errors() {
        return this._.errors;
    }

    /**
     * Set the errors associated with the input.
     *
     * @param {string[]} errors
     */
    set errors(errors) {
        this._.errors = errors;
    }

    /**
     * Whether the input is valid (i.e. has no errors).
     *
     * @type {boolean}
     */
    get valid() {
        return this.errors.length == 0;
    }
}

export default FormInputProperties;