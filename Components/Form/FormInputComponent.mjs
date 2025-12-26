/**
 * Form input component with label, validation status, and loading states.
 * @module Components/Form/FormInputComponent
 */
import Component from "../Component.mjs";

import { BaseInput } from "./FormBaseComponents.mjs";
import { load as loadSASS } from "../../Style/SASS.mjs";

const { _filename, __dirname } = currentFile(import.meta);

/*
const { formInputCSS, formLayoutCSS, inputsCSS } = loadSASS(
    ["component--form-input.scss", "form--layout.scss", "form--inputs.scss"].map((name) => `${__dirname}/sass/${name}`)
);
*/

/**
 * Form input component extending BaseInput with enhanced UI features.
 * @class FormInputComponent
 * @extends BaseInput
 */
class FormInputComponent extends BaseInput {
    static tag = "form-input";

    static config = {
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
        return [formLayoutCSS, inputsCSS, formInputCSS];
    }

    static html() {
        const type = this.hasAttribute("type") ? this.getAttribute("type") : "text";
        const classes = ["input", `type-${type}`, "initial"];
        if (this.label) classes.push("has-label");
        if (this.disabled) classes.push("disabled");
        switch (this.type) {
            case "":
                break;
        }
        return `
            <div ref="wrapper" class="${classes.join(" ")}">
                <div class="status-wrapper">
                    <div class="status">
                        <status-icon ref="status.icon" size="16.25" color="#FFFFFF"></status-icon>
                        <div class="bg"></div>
                    </div>
                </div>
                <div ref="etags" class="error-tags"></div>
                ${
                    this.hasAttribute("loadable")
                        ? `
                <div class="loading-wrapper">
                    <m-ring ref="loader" size="30" color="var(--color-yellow)" animate ></m-ring>
                </div>
                `
                        : ""
                }
                <input id="${this.id || this.name.replace("_", "-")}" ref="input" name="${
            this.name
        }" type="${type}" value="${this.value ?? ""}" placeholder="-" ${this.disabled ? "disabled" : ""} />
                ${
                    this.label
                        ? `<label ref="label" for="${this.id || this.name.replace("_", "-")}">${this.label}</label>`
                        : ""
                }
            </div>
        `;
    }

    onFirstConnect() {
        super.onFirstConnect();
        this.ref("input").addEventListener("input", () => {
            this.value = this.ref("input").value;
        });
    }

    onPropertyChanged(property, old, value) {
        super.onPropertyChanged(property, old, value);
        //  console.log(property, old, value);
        switch (property) {
            case "placeholder":
                break;
            case "value":
                this.ref("input").value = value;
                break;
        }
    }

    onValueChange(value) {
        console.log("ovc");
        this.ref("input").value = value;
    }

    loading(state = true) {
        const ring = this.ref("loader");
        if (ring) {
            if (state && !this._loading) {
                this._loading = true;
                ring.spin();
            } else if (!state && this._loading) {
                ring.stop("success");
                this._loading = false;
            }
        }
    }
}

customElements.define(FormInputComponent.tag, FormInputComponent);