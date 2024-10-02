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

    buildNative() {
        if (!this.constructor.nativeInput) return;

        const nativeConfig = this.constructor.nativeInput;
        const native = document.createElement(nativeConfig.tag);

        for (const attribute in nativeConfig.attributes) {
            const value = nativeConfig.attributes[attribute].includes("{{")
                ? this[nativeConfig.attributes[attribute].replace(/[\{\}]/g, "")]
                : nativeConfig.attributes[attribute].includes("[")
                ? this.getAttribute(nativeConfig.attributes[attribute].replace(/[\[\]}]/g, ""))
                : nativeConfig.attributes[attribute];

            native.setAttribute(attribute, value);
        }

        this.appendChild(native);
        this.native = native;
    }

    onChildren(childNodes) {
        const nativeInputs = childNodes.filter(
            (node) =>
                ["input", "select", "textarea"].includes(node.tagName.toLowerCase()) ||
                node.querySelector("input, select, textarea")
        );

        if (nativeInputs.length > 1) {
            this.onMultipleNativeInput(nativeInputs);
        } else if (nativeInputs.length === 1) {
            this.onNativeInput(nativeInputs[0]);
        } else {
            this.buildNative();
        }
    }

    onMultipleNativeInput() {
        const inputsById = {};

        for (const nativeElement of this.native) {
            const elementTag = nativeElement.tagName.toLowerCase();

            if (elementTag === "label") {
                const id = nativeElement.getAttribute("for");

                if (!inputsById[id]) {
                    inputsById[id] = {};
                }

                inputsById[id].label = nativeElement.innerText.trim();

                const inputElement = nativeElement.querySelector("input, select, textarea");

                if (inputElement) {
                    inputsById[id].input = inputElement;
                }
            } else if (elementTag === "input") {
                const id = nativeElement.getAttribute("id");

                if (!inputsById[id]) {
                    inputsById[id] = {};
                }

                inputsById[id].input = nativeElement;
                inputsById[id].name = nativeElement.getAttribute("name");
                inputsById[id].type = nativeElement.getAttribute("type");
            }
        }
    }

    onNativeInput() {
        const isMultiple = this.native.length > 1;

        const nativeTag = this.native[0].tagName.toLowerCase();

        if (nativeTag === "select") {
            const value = this.getAttribute("value");

            if (value) {
                const option = this.native[0].querySelector(`option[value="${value}"]`);

                if (option) {
                    option.selected = true;
                }
            }

            this.native[0].addEventListener("change", (event) => {
                this.dispatchEvent(new CustomEvent("change", { detail: event.target.value }));
            });

            this.native[0].addEventListener("input", (event) => {
                this.dispatchEvent(new CustomEvent("input", { detail: event.target.value }));
            });
        }
    }

    onFirstConnect() {
        const { name: inputName, id: inputId } = this.attributes;

        if (inputName) {
            this.name = inputName.value;
            this.id = inputId ? inputId.value : `input--${this.name}`;
        }

        if (this.parentNode.classList.contains("row")) {
            const parentChildren = this.parentNode.children;
            const childCount = parentChildren.length;

            if (childCount > 1) {
                this.style.width = `calc(${100 / childCount}% - ${childCount}rem)`;
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
