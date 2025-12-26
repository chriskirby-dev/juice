/**
 * Checkbox form component.
 * @module Components/Form/FormCheckboxComponent
 */

import Component from "../Component.mjs";
import { BaseInput } from "./FormBaseComponents.mjs";
import { load as loadSASS } from "../../Style/SASS.mjs";

const { _filename, __dirname } = currentFile(import.meta);
/*
const { formInputCSS, formLayoutCSS, inputsCSS } = loadSASS(
    ["component--form-input.scss", "form--layout.scss", "form--inputs.scss"].map((name) => `${__dirname}/sass/${name}`)
);*/

/**
 * FormCheckboxComponent provides a styled checkbox input with custom appearance.
 * @class FormCheckboxComponent
 * @extends BaseInput
 */
class FormCheckboxComponent extends BaseInput {
    static tag = "form-checkbox";

    types = "checkbox";

    static config = {
        emitter: true,
        properties: {
            placeholder: { linked: true },
        },
    };

    static get observed() {
        return {
            attributes: ["placeholder"],
            properties: ["placeholder"],
        };
    }

    static get style() {
        return [
            inputsCSS,
            formInputCSS,
            {
                label: {
                    position: "relative !important",
                },
                "input[type=checkbox]": {
                    height: "25px !important",
                    width: "25px !important",
                    marginRight: "1rem !important",
                    border: "1px solid var(--color-lt-blue)",
                    cursor: "pointer",
                    backgroundImage: `url("data:image/svg+xml,<svg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'><path d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/></svg>")`,
                },
                "::slotted(input[type=checkbox])": {
                    height: "25px !important",
                    width: "25px !important",
                    marginRight: "1rem !important",
                    backgroundImage: `url("data:image/svg+xml,<svg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'><path d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/></svg>")`,
                },
            },
        ];
    }

    static html() {
        return `
            <div>
            <label>
            <input type="checkbox" name="${this.name}" value="${this.value}" />
            <slot></slot>
            <span>${this.label}</span>
            </label>
            <div>
        `;
    }

    get checked() {
        return this.native.checked;
    }

    onReady() {
        this.addEventListener("click", (e) => {
            if (e.target === this) {
                this.native.checked = !this.native.checked;
            }

            this.value = this.native.checked ? this.native.value : "";
            this.dispatchEvent(new CustomEvent("checked", { detail: this.native.checked }));
        });
    }
}

customElements.define(FormCheckboxComponent.tag, FormCheckboxComponent);