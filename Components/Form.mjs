import Component from "./Component.mjs";

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
        console.log("buildNative", this.constructor.nativeInput);
        if (this.constructor.nativeInput) {
            const nativeConfig = this.constructor.nativeInput;
            const native = document.createElement(nativeConfig.tag);
            for (let attr in nativeConfig.attributes) {
                const value = nativeConfig.attributes[attr].includes("{{")
                    ? this[nativeConfig.attributes[attr].replace(/[\{\}]/g, "")]
                    : nativeConfig.attributes[attr].includes("[")
                    ? this.getAttribute(nativeConfig.attributes[attr].replace(/[\[\]}]/g, ""))
                    : nativeConfig.attributes[attr];
                native.setAttribute(attr, value);
            }
            this.appendChild(native);
            this.native = native;
        }
    }

    onChildren(childNodes) {
        console.log("onChildren", childNodes);
        if (!childNodes || !childNodes.length) {
            this.buildNative();
        } else {
            this.native = childNodes.filter(
                (node) =>
                    ["input", "select", "textarea"].includes(node.tagName.toLowerCase()) ||
                    node.querySelector("input, select, textarea")
            );
            console.log(this.native);
            if (this.native.length) {
                if (this.native.length > 1) {
                    return this.onMultipleNativeInput();
                }
                this.onNativeInput();
            } else {
                this.buildNative();
            }
        }
    }

    onMultipleNativeInput() {
        const map = {};
        for (let i = 0; i < this.native.length; i++) {
            const native = this.native[i];
            if (native.tagName.toLowerCase() == "label") {
                const id = native.getAttribute("for");
                if (!map[id]) map[id] = {};
                map[id].label = native.innerText.trim();
                if (native.querySelector("input, select, textarea"))
                    this.native.push(native.querySelector("input, select, textarea"));
            } else if (["input"].includes(native.tagName.toLowerCase())) {
                const id = native.getAttribute("id");
                if (!map[id]) map[id] = {};
                map[id].input = native;
                map[id].name = native.getAttribute("name");
                map[id].type = native.getAttribute("type");
            }
        }
        console.log(map);
    }

    onNativeInput() {
        const multiple = this.native.length > 1;

        this.nativeTag = this.native.tagName.toLowerCase();

        if (this.nativeTag === "select") {
            if (this.hasAttribute("value")) {
                this.native.querySelector('option[value="' + this.getAttribute("value") + '"]').selected = true;
            }
            this.native.addEventListener("change", (e) => {
                this.dispatchEvent(new CustomEvent("change", { detail: e.target.value }));
            });
            this.native.addEventListener("input", (e) => {
                this.dispatchEvent(new CustomEvent("input", { detail: e.target.value }));
            });
        }
        console.log(this.native);
    }

    onFirstConnect() {
        if (this.hasAttribute("name")) {
            this.name = this.getAttribute("name");
            console.log(this.name);
            if (!this.hasAttribute("id")) {
                this.id = "input--" + this.name;
            }
        }

        if (this.parentNode.classList.contains("row")) {
            const childLen = this.parentNode.children.length;
            if (childLen > 1) {
                this.style.width = `calc( ${100 / childLen}% - ${childLen}rem )`;
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
