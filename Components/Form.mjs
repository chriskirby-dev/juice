/**
 * Form input component with validation and event handling.
 * Wraps native form inputs with additional functionality.
 * @module Components/Form
 */

import Component from "./Component.mjs";

/**
 * @class FormInput
 * @extends {Component.HTMLElement}
 * @description A custom form input component
 * @property {string} name - The name of the input
 * @property {string} value - The value of the input
 * @property {string} placeholder - The placeholder text of the input
 * @property {boolean} disabled - Whether or not the input is disabled
 * @property {boolean} readonly - Whether or not the input is readonly
 * @property {string} type - The type of input (text, password, etc.)
 * @property {string} nativeTag - The native tag of the input (input, select, textarea)
 * @property {HTMLElement} native - The native input element
 * @property {string} label - The label of the input
 * @property {string} id - The id of the input
 * @property {boolean} required - Whether or not the input is required
 * @property {boolean} willValidate - Whether or not the input will validate
 * @property {string} validationMessage - The validation message of the input
 * @property {boolean} checkValidity - Whether or not the input is valid
 * @property {boolean} validity - Whether or not the input is valid
 * @property {boolean} form - The form element of the input
 * @description
 * When the component is connected, it will check if it has a native tag or not.
 * If it does, it will get the name and id of the input and set it as a property.
 * If it doesn't, it will create a native input element and set it as a property.
 * It will also add a change event listener to the native input element.
 * When the input changes, it will dispatch a change event with the new value.
 * When the input is blurred, it will dispatch a blur event.
 * When the input is focused, it will dispatch a focus event.
 * When the input is valid, it will dispatch a valid event.
 * When the input is invalid, it will dispatch an invalid event.
 * @example
 * <form-input name="username" value="John Doe"></form-input>
 */

class FormInput extends Component.HTMLElement {
    static tag = "form-input";
    static type = "input";

    static formAssociated = true;

    static allowedStates = [""];

    static nativeInput = {
        tag: "input",
        attributes: {
            type: "text",
            name: "[name]",
            id: "[id]",
        },
    };

    static config = {
        properties: {
            name: { linked: true },
            value: { linked: true },
            placeholder: { linked: true },
            disabled: { type: "exists", linked: true },
            required: { type: "exists", linked: true },
            readonly: { type: "exists", linked: true },
        },
        useInternals: true,
    };

    static get observed() {
        return {
            all: ["id", "name", "disabled", "readonly", "placeholder", "value"],
        };
    }

    static get style() {
        return [
            {
                ":host": {
                    marginBottom: "1rem",
                },
            },
        ];
    }

    static html() {
        return `<div class="native"><slot></slot></div>`;
    }

    nativeTag = "input";

    constructor() {
        super();
    }

    get value() {
        return this.internals.formValue;
    }

    set value(val) {
        this.internals.setFormValue(val);
    }

    get form() {
        return this.internals.form;
    }

    get validity() {
        return this.internals.validity;
    }

    get validationMessage() {
        return this.internals.validationMessage;
    }

    get willValidate() {
        return this.internals.willValidate;
    }

    get checkValidity() {
        return this.internals.checkValidity();
    }

    get readonly() {
        return this.hasAttribute("readonly");
    }

    onConnect() {}

    buildNativeElement() {
        const nativeConfig = this.constructor.nativeInput;
        const nativeElement = document.createElement(nativeConfig.tag);

        Object.entries(nativeConfig.attributes).forEach(([attribute, value]) => {
            let attributeValue = value;

            if (value.includes("{{")) {
                attributeValue = this[value.replace(/[\{\}]/g, "")];
            } else if (value.includes("[")) {
                attributeValue = this.getAttribute(value.replace(/[\[\]}]/g, ""));
            }

            nativeElement.setAttribute(attribute, attributeValue);
        });

        this.appendChild(nativeElement);
        this.native = nativeElement;
    }

    onChildren(childNodes) {
        const nativeElements = childNodes.filter(
            (node) =>
                ["input", "select", "textarea"].includes(node.tagName.toLowerCase()) ||
                node.querySelector("input, select, textarea")
        );

        if (nativeElements.length > 1) {
            this.onMultipleNativeInput(nativeElements);
        } else if (nativeElements.length === 1) {
            this.onNativeInput(nativeElements[0]);
        } else {
            this.buildNativeElement();
        }
    }

    onMultipleNativeInput() {
        const inputsById = {};
        const hasMultipleInputs = Array.isArray(this.native);
        const nativeElements = hasMultipleInputs ? this.native : [this.native];

        for (const nativeElement of nativeElements) {
            const elementTag = nativeElement.tagName.toLowerCase();

            if (elementTag === "label") {
                const inputId = nativeElement.getAttribute("for");

                if (!inputsById[inputId]) {
                    inputsById[inputId] = {};
                }

                inputsById[inputId].label = nativeElement.innerText.trim();

                const inputElement = nativeElement.querySelector("input, select, textarea");

                if (inputElement) {
                    inputsById[inputId].input = inputElement;
                }
            } else if (elementTag === "input") {
                const inputId = nativeElement.getAttribute("id");

                if (!inputsById[inputId]) {
                    inputsById[inputId] = {};
                }

                inputsById[inputId].input = nativeElement;
                inputsById[inputId].name = nativeElement.getAttribute("name");
                inputsById[inputId].type = nativeElement.getAttribute("type");
            }
        }
    }

    onNativeInput() {
        const hasMultipleInputs = this.native.length > 1;
        const nativeElement = hasMultipleInputs ? this.native[0] : this.native;
        const tagName = nativeElement.tagName.toLowerCase();

        if (tagName === "select") {
            const selectedValue = this.getAttribute("value");

            if (selectedValue) {
                const selectedOption = nativeElement.querySelector(`option[value="${selectedValue}"]`);

                if (selectedOption) {
                    selectedOption.selected = true;
                }
            }

            nativeElement.addEventListener("change", (event) => {
                this.dispatchEvent(new CustomEvent("change", { detail: event.target.value }));
            });

            nativeElement.addEventListener("input", (event) => {
                this.dispatchEvent(new CustomEvent("input", { detail: event.target.value }));
            });
        }
    }

    onFirstConnect() {
        const { name, id } = this.attributes;

        if (name) {
            this.name = name.value;
            this.id = id ? id.value : `input--${this.name}`;
        }

        if (this.parentNode.classList.contains("row")) {
            const siblings = this.parentNode.children;
            const siblingCount = siblings.length;

            if (siblingCount > 1) {
                this.style.width = `calc(${100 / siblingCount}% - ${siblingCount}rem)`;
            }
        }
    }
}

customElements.define(FormInput.tag, FormInput);

class FormCheckbox extends Component.Label {
    static tag = "form-checkbox";

    static type = "checkbox";

    static allowedStates = ["idle", "active", "checked"];

    static nativeInput = {
        tag: "input",
        attributes: {
            type: "checkbox",
            name: "{{name}}",
            id: "{{id}}",
        },
    };

    static get style() {
        return [
            `
            :root{

            }

            input {
                width: 100%;
                height: 100%;
                display: block;
                margin: 0;
                padding: 0;
                border: 0;
                background: transparent;
                cursor: pointer;
                outline: none;
                appearance: none;
                position:absolute;
                
            }
        `,
        ];
    }

    static html() {
        return `
        <label for="">
        <div class="indicator">
        </div>
        <span><slot></slot></span>
        </label>
        `;
    }

    onStateChange(state) {}
}

customElements.define(FormCheckbox.tag, FormCheckbox);

class FormOption extends Component.HTMLElement {
    static tag = "form-option";
    static type = "option";

    static config = {
        properties: {
            label: { linked: true },
            value: { linked: true, default: "" },
        },
    };

    static get observed() {
        return {
            all: ["id", "label", "value"],
        };
    }

    static get style() {
        return [{}];
    }

    static html() {
        return `<div class="native"><slot></slot></div>`;
    }

    onStateChange(state, previous) {}

    onFirstConnect() {}
}

customElements.define(FormOption.tag, FormOption);

class FormLabel extends Component.HTMLElement {
    static tag = "form-label";
    static type = "label";

    static config = {
        properties: {
            label: { linked: true },
            value: { linked: true, default: "" },
        },
    };

    static get observed() {
        return {
            all: ["id", "label", "value"],
        };
    }

    static get style() {
        return [
            {
                ":root": {
                    display: "block",
                },
            },
        ];
    }

    static html() {
        return `<div class="native"><slot></slot></div>`;
    }

    onStateChange(state, previous) {}

    onFirstConnect() {
        this.for = document.getElementById(this.getAttribute("for"));
        this.addEventListener("click", () => this.for.click());
    }
}

customElements.define(FormLabel.tag, FormLabel);