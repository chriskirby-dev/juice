import Component from "../Component.mjs";
import Request from "../../core/HTTP/Request.mjs";
import String from "../../core/Util/String.mjs";
import toggleCSS from "!../../../sass/form/form--field-toggle.scss?toString";
import wrapperCSS from "!../../../sass/form/form--field-wrapper.scss?toString";
import inputsCSS from "!../../../sass/form/form--inputs.scss?toString";
import formsCSS from "!../../../sass/component--forms.scss?toString";
import formButtonCSS from "!../../../sass/component--form-buttons.scss?toString";
import formFieldCSS from "!../../../sass/component--form-field.scss?toString";
import formInputCSS from "!../../../sass/component--form-input.scss?toString";
import Attributes from "../../core/Dom/Attributes.mjs";
import Google from "../../Google/Google.mjs";

import { BaseInput } from "./FormBaseComponents.mjs";

import "./FormSelectComponent.mjs";
import "./FormRangeComponent.mjs";
import "./FormColorComponent.mjs";
import "./FormInputComponent.mjs";
import "./FormTagComponent.mjs";
import "./FormCheckboxComponent.mjs";
import "./FormTextComponent.mjs";
import "./FormDialComponent.mjs";

const fieldAliases = {
    country: ["country"],
    address_line1: ["address_line1", "street_address"],
    address_line2: ["address_line2", "unit"],
    city: ["city", "locality"],
    state: ["state", "administrative_area_level_1"],
    zip: ["zip", "postal_code"],
    zip4: ["zip-suffix", "zip4", "postal_code_suffix"],
};

class FormTemplates {
    static check({ name, attributes = {}, options = {} }) {
        const type = "checkbox";
        const attrs = new Attributes(attributes);
        return `
        <input type="checkbox" name="${name}" ${attrs.toString()} />
        `;
    }

    static radio({ name, attributes = {}, options = {} }) {
        const type = "radio";
        const attrs = new Attributes(attributes);
        return `
        <input type="radio" name="${name}" ${attrs.toString()} />
        `;
    }

    static select({ name, attributes = {}, options = {} }) {
        const type = "select";
        const attrs = new Attributes(attributes);
        return `
        <select ${attrs.toString()} ></select>
        `;
    }

    static text({ name, attributes = {}, options = {} }) {
        const type = "textarea";
        const attrs = new Attributes(attributes);

        return `
        <textarea ${attrs.toString()} ></textarea>
        `;
    }

    static input({ type = "text", name = null, value = "", attributes = {} }) {
        if (!name && attributes.name) {
            name = attributes.name;
            delete attributes.name;
        }

        attributes.type = type;

        return `<input name="${name}" ${attrs.toString()} />`;
    }

    static wrapper({ type, name, label, input, before = null, after = null }) {
        return `
        <div class="field type-${type} name-${name}">
            ${before ? before : ""}
            <div class="input">${input}</div>
            <label>${label}</label>
            ${after ? after : ""}
        </div>
        `;
    }

    static label(text, id) {
        return `<label for="${id}" >${text}</label>`;
    }
}

class BasicFormControl extends CustomDom.HTMLElement {
    static formAssociated = true;

    constructor() {
        super();
        // Get access to the internal form control APIs
        this.internals_ = this.attachInternals();
        // internal value for this control
        this._value = 0;
    }

    // Form controls usually expose a "value" property
    get value() {
        return this._value;
    }
    set value(v) {
        this._value = v;
    }

    get form() {
        return this.internals_.form;
    }
    get name() {
        return this.getAttribute("name");
    }
    get type() {
        return this.localName;
    }
    get validity() {
        return this.internals_.validity;
    }
    get validationMessage() {
        return this.internals_.validationMessage;
    }
    get willValidate() {
        return this.internals_.willValidate;
    }

    checkValidity() {
        return this.internals_.checkValidity();
    }
    reportValidity() {
        return this.internals_.reportValidity();
    }
}

class FormSubmit extends CustomDom.HTMLElement {
    static tag = "form-submit";

    form;

    static config = {
        properties: {
            label: { linked: true },
            loading: { linked: true },
            disabled: { type: "exists" },
            redirect: { linked: true },
        },
    };

    static get observed() {
        return {
            attributes: ["loading", "disabled", "label", "form"],
            properties: ["loading", "label"],
        };
    }

    static get style() {
        return [formButtonCSS];
    }

    setForm(form) {
        this.form = form;
    }

    onFirstConnect() {
        this.ref("btn").addEventListener(
            "click",
            (e) => {
                e.preventDefault();
                e.stopPropagation();

                return this.submit();
            },
            false
        );
    }

    submit() {
        this.form = this.form || this.closest("form");
        const TMP = document.createElement("input");
        TMP.type = "submit";
        this.form.appendChild(TMP);
        TMP.click();
        this.form.removeChild(TMP);
    }

    renderLoader() {
        if (this.hasAttribute("loader")) {
            return `
                <div class="icon">
                    <m-ring ref="loader" size="30" stroke="8" bg="rgba(255,255,255,0.3)"></m-ring> 
                </div>
            `;
        } else {
            return "";
        }
    }

    renderIcon() {
        if (this.loader) {
            return `
            <div class="icon">
                
            </div>
        `;
        }
    }

    static html() {
        const type = this.hasAttribute("type") ? this.getAttribute("type") : "text";
        const label = FormTemplates.label(this.label, this.id);

        switch (this.type) {
            case "":
                break;
        }
        return `
        <button ref="btn"   >
            <div class="contents">
                ${this.renderLoader()}
                <div class="label"><slot></slot></div>
            </div>
        </button>
        `;
    }

    onAttributeChanged(property, old, value) {
        switch (property) {
            case "disabled":
                if (value) {
                    this.ref("btn").setAttribute("disabled", "");
                } else {
                    this.ref("btn").removeAttribute("disabled");
                }
                break;
            case "loading":
                if (value) {
                    this.ref("loader").spin();
                } else {
                    this.ref("loader").stop();
                }
                break;
        }
    }
}

customElements.define(FormSubmit.tag, FormSubmit);

class FieldField extends CustomDom.HTMLElement {
    static tag = "form-field";

    inputTypes = [];

    static config = {
        properties: {
            label: { linked: true },
        },
    };

    input;

    labelPosition = "before";

    static get observed() {
        return {
            attributes: ["label"],
            properties: ["label"],
        };
    }

    static get style() {
        return [formFieldCSS];
    }

    static html() {
        const label = FormTemplates.label(this.label, this.control ? `input--${this.name.replace("_", "-")}` : "");
        return `
        ${this.labelPosition == "before" ? label : ""}
        ${this.labelPosition == "around" ? label.replace("</label>", "") : ""}
        <slot ref="slot" ></slot>
        ${this.labelPosition == "around" ? "</label>" : ""}
        ${this.labelPosition == "after" ? label : ""}
        `;
    }

    findControl() {
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].customFormElement || this.children[i].form) {
                this.setControl(this.children[i]);
                break;
            }
        }
    }

    get name() {
        if (!this.control) this.findControl();
        return this.control.name;
    }

    get type() {
        if (!this.control) this.findControl();
        return this.control.type || this.control.tagName;
    }

    beforeRender() {}

    static get style() {
        return [wrapperCSS, inputsCSS];
    }

    setControl(control) {
        console.log("Set Control", control);
        this.control = control;
        this.className = `field type-${this.type} field-${this.name}`;
        this.render();
    }

    onFirstConnect() {
        this.findControl();
    }

    onReady() {
        this.ref("slot").addEventListener("slotchange", (e) => {
            let nodes = slot.assignedNodes({ flatten: true });
            if (!this.control) this.findControl();
            console.log("Assigned Nodes", nodes);
        });
    }
}

customElements.define(FieldField.tag, FieldField);

class FieldToggle extends CustomDom.HTMLElement {
    static tag = "field-toggle";

    static config = {
        properties: {
            checked: { type: "boolean", linked: true, default: true },
        },
    };

    static html() {
        return `
        <div class="field type-toggle remember">
            <label>
                <span class="label-txt">Include</span>
                <div class="switch">
                    <input type="checkbox" checked value="1" ref="checkbox" />
                    <span class="toggler"></span>
                </div>
            </label>
        </div>
        `;
    }

    static get style() {
        return toggleCSS;
    }

    static get observedAttributes() {
        return ["checked"];
    }

    static get observedProperties() {
        return ["checked"];
    }

    onConnect() {
        const checkbox = this.ref("checkbox");
        this.checked = checkbox.checked;
        checkbox.addEventListener(
            "click",
            () => {
                this.checked = checkbox.checked;
                this.dispatchEvent(new Event("toggle"));
            },
            false
        );
    }

    onPropertyChanged(prop, old, value) {
        switch (prop) {
            case "checked":
                const checkbox = this.ref("checkbox");
                checkbox.checked = value;
                break;
        }
    }
}

customElements.define(FieldToggle.tag, FieldToggle);

class FieldStatus extends CustomDom.HTMLElement {
    static tag = "field-status";

    static config = {
        properties: {
            state: { linked: true },
            size: { type: "number", linked: true },
        },
    };

    static get style() {
        return {
            ".wrapper": {
                position: "relative",
                width: "40px",
                height: "40px",
            },
            ".anchor": {
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "100%",
                height: "100%",
                transform: "translate(-50%, -50%)",
            },
            ".circle": {
                position: "absolute",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: "50%",
            },
            ".fill": {
                position: "absolute",
                width: "100%",
                height: "100%",
                zIndex: 10,
                border: "0",
                borderRadius: "50%",
                boxSizing: "border-box",
            },
            ".fill-tmp": {
                position: "absolute",
                width: "100%",
                height: "100%",
                zIndex: 30,
                border: "0",
                borderRadius: "50%",
                boxSizing: "border-box",
                transition: "border-width 0.3s ease-out 0.6s",
            },
            ".graphic": {
                position: "absolute",
                width: "100%",
                height: "100%",
                zIndex: 50,
                display: "none",
            },
            ".wrapper.ready .graphic": {
                display: "block",
            },
            ".stroke": {
                position: "absolute",
                width: "100%",
                height: "100%",
                zIndex: 20,
                borderRadius: "50%",
                boxSizing: "border-box",
            },
            ".stroke svg": {
                position: "relative",
                width: "100%",
                height: "100%",
            },
            ".stroke svg circle": {
                strokeMiterlimit: 10,
                fill: "none",
                transition: "stroke-dashoffset 0.6s cubic-bezier(0.65, 0, 0.45, 1)",
            },
            ".graphic svg .check": {
                strokeMiterlimit: 10,
                fill: "none",
                transition: "stroke-dashoffset 0.4s cubic-bezier(0.65, 0, 0.45, 1)",
            },
            ".graphic svg .x-1": {
                strokeMiterlimit: 10,
                fill: "none",
                transition: "stroke-dashoffset 0.4s cubic-bezier(0.65, 0, 0.45, 1)",
            },
            ".graphic svg .x-2": {
                strokeMiterlimit: 10,
                fill: "none",
                transition: "stroke-dashoffset 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.3s",
            },
            ".graphic svg .warning": {
                strokeMiterlimit: 10,
                fill: "none",
                transition: "stroke-dashoffset 0.4s cubic-bezier(0.65, 0, 0.45, 1)",
            },
            ".graphic svg .info-1": {
                strokeMiterlimit: 10,
                fill: "none",
                transition: "stroke-dashoffset 0.4s cubic-bezier(0.65, 0, 0.45, 1)",
            },
            ".graphic svg .info-2": {
                strokeMiterlimit: 10,
                fill: "none",
                transition: "stroke-dashoffset 0.2s cubic-bezier(0.65, 0, 0.45, 1) 0.4s",
            },
        };
    }

    static html() {
        return `
            <div class="wrapper" ref="wrapper" >
                <div class="anchor" >
                    <div class="circle" ref="circle" >
                        <div class="graphic" ref="graphic" >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                                <path ref="check" class="check" stroke-linecap="round" stroke="#FFFFFF" fill="none" stroke-width="8" d="M28.2 54.4l14.2 14.4 33.4-33.6"/>
                                <path ref="x-1" class="x-1" stroke-linecap="round" stroke="#FFFFFF" fill="none" stroke-width="8" d="M 30,30 L 70,70"/>
                                <path ref="x-2" class="x-2" stroke-linecap="round" stroke="#FFFFFF" fill="none" stroke-width="8" d="M 70,30 L 30,70"/>
                                <path ref="warning" class="warning" stroke-linecap="round" stroke="#FFFFFF" fill="none" stroke-width="2" d="M 50,20 L 75,70 L 25,70 Z"/>
                                <path ref="info-1" class="info-1" stroke-linecap="round" stroke="#FFFFFF" fill="none" stroke-width="20" d="M 50,75 L 50,50"/>
                                <path ref="info-2" class="info-2" stroke-linecap="round" stroke="#FFFFFF" fill="none" stroke-width="20" d="M 50,30 L 50,29"/>
                            </svg>
                        </div>
                        <div class="stroke" ref="stroke-wrapper" >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                                <circle ref="stroke" cx="50" cy="50" r="50" fill="none"/>
                            </svg>
                        </div>
                        <div class="fill-tmp" ref="fill-tmp" ></div>
                        <div class="fill" ref="fill" ></div>
                    </div>
                </div>
            </div>
        `;
    }

    static get observedAttributes() {
        return ["size", "state"];
    }

    static get observedProperties() {
        return ["size", "state"];
    }

    onConnect() {
        this.styles.clear("color");
        this.styles.clear("size-style");
        this.styles.clear("graphic");
    }

    onReady() {
        this.ref("fill-tmp").addEventListener("transitionend", () => {
            this.ref("fill").style.backgroundColor = this.color;
            this.styles.clear("color");
        });
    }

    setState(state) {
        this.styles.clear("graphic");

        let graphic_style = "";
        switch (state) {
            case "info":
                this.color = "#007cc7";
                graphic_style += `
                .graphic svg .info-1,
                .graphic svg .info-2{
                    stroke-dashoffset: 0;
                }
                `;
                break;
            case "warning":
                this.color = "#FFAB1A";
                graphic_style += `
                .graphic svg .warning{
                    stroke-dashoffset: 0;
                }
                `;
                break;
            case "error":
                this.color = "#D41111";
                graphic_style += `
                .graphic svg .x-1,
                .graphic svg .x-2{
                    stroke-dashoffset: 0;
                }
                `;
                break;
            case "success":
                this.color = "#73C322";
                graphic_style += `
                .graphic svg .check{
                    stroke-dashoffset: 0;
                }
                `;
                break;
            default:
                this.color = "transparent";
        }

        const color_style = `
            .stroke svg circle{
                stroke: ${this.color};
                stroke-dashoffset: 0;
            }
            .fill-tmp{
                border: ${this.size / 2}px solid ${this.color};
            }
            .circle{
                animation:circle-scale .3s ease-in-out .4s both;
            }
            
        `;

        this.styles.replace(color_style, "color");
        setTimeout(() => {
            this.styles.replace(graphic_style, "graphic");
        }, 750);
    }

    updateSize() {
        if (this.offsetParent === null) return;
        const radius = this.size / 2;
        const dashSize = this.ref("stroke").getTotalLength();
        const strokeWidth = this.size / 4;
        this.ref("stroke").setAttribute("r", 50 - strokeWidth / 2);

        const checkDashSize = this.ref("check").getTotalLength();
        const xDashSize = this.ref("x-1").getTotalLength();
        const warningDashSize = this.ref("warning").getTotalLength();
        const infoDashSize = this.ref("info-1").getTotalLength();
        const info2DashSize = this.ref("info-2").getTotalLength();

        const style = `
        .graphic svg .info-1{
            stroke-width: 10;
            stroke-dasharray: ${infoDashSize};
            stroke-dashoffset: ${infoDashSize};
        }
        .graphic svg .info-2{
            stroke-width: 10;
            stroke-dasharray: ${info2DashSize};
            stroke-dashoffset: ${info2DashSize};
        }
        .graphic svg .x-1{
            stroke-width: 10;
            stroke-dasharray: ${xDashSize};
            stroke-dashoffset: ${xDashSize};
        }
        .graphic svg .x-2{
            stroke-width: 10;
            stroke-dasharray: ${xDashSize};
            stroke-dashoffset: -${xDashSize};
        }
        .graphic svg .check{
            stroke-width: 10;
            stroke-dasharray: ${checkDashSize};
            stroke-dashoffset: ${checkDashSize};
        }
        .graphic svg .warning{
            stroke-width: 10;
            stroke-dasharray: ${warningDashSize};
            stroke-dashoffset: ${warningDashSize};
        }
        .stroke svg circle{
            stroke-width: ${strokeWidth};
            stroke-dasharray: ${dashSize};
            stroke-dashoffset: ${dashSize};
        }
        @keyframes circle-scale {
            0%, 100% {
              transform: none;
            }
            50% {
              transform: scale3d(1.2, 1.2, 1);
            }
        }
        `;

        this.styles.replace(style, "size-style");
        this.ref("wrapper").classList.add("ready");
    }

    onPropertyChanged(prop, old, value) {
        switch (prop) {
            case "size":
                this.ref("wrapper").style.width = `${value}px`;
                this.ref("wrapper").style.height = `${value}px`;
                this.updateSize();
                break;
            case "state":
                this.setState(value);
                break;
        }
    }
}

customElements.define(FieldStatus.tag, FieldStatus);

class GoogleAddressAutocomplete extends CustomDom.HTMLElement {
    static tag = "google-autoaddress";

    static config = {
        observe: true,
        emitter: true,
    };

    static get style() {
        return {
            "*": {
                boxSizing: "border-box",
            },
            ".wrapper": {
                position: "relative",
            },
            ".google-wrapper": {
                position: "relative",
                paddingBottom: "1rem",
            },
            ".field": {
                position: "relative",
            },
            ".field label": {
                display: "block",
                border: "1px solid transparent",
                position: "absolute",
                top: "0",
                left: "0",
                paddingTop: "0.5rem",
                paddingLeft: "0.8rem",
                paddingRight: "0.8rem",
                display: "block",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "bold",
                transition: "0.4s ease",
                whiteSpace: "nowrap",
            },
            ".field input": {
                appearance: "none",
                lineHeight: 1.6,
                border: "1px solid #e5e5e5",
                backgroundColor: "#f9f9f9",
                paddingTop: "1.5rem",
                paddingLeft: "0.8rem",
                paddingBottom: "0.25rem",
                width: "100%",
                fontFamily: "inherit",
                margin: 0,
                fontSize: "1rem",
            },
            ".field input::placeholder": {
                color: "#f9f9f9",
            },
            ".field input:placeholder-shown:not(:focus) + label": {
                paddingTop: "1rem",
                fontSize: "1.2rem",
                fontWeight: "normal",
            },
            ".required label:after": {
                content: '"*"',
                color: "#D41111",
            },
            ".form-fields": {
                display: "none",
            },
            ".google-wrapper .current-address": {
                display: "none",
                fontSize: "1.2rem",
                fontWeight: "600",
            },
            ".wrapper.has-address .google-wrapper .field": {
                display: "none",
            },
            ".wrapper.has-address:not(.saved-address) .form-fields": {
                display: "block",
            },
            ".wrapper.has-address:not(.saved-address) .google-wrapper": {
                display: "none",
            },
            ".wrapper.has-address.saved-address .google-wrapper .field": {
                display: "block",
            },
            ".change-address": {
                fontSize: "0.9rem",
                color: "#007cc7",
                cursor: "pointer",
            },
        };
    }

    static html() {
        return `
        <div class="wrapper" ref="wrapper">

            <div class="google-wrapper" ref="google-wrapper">
                
                <div class="field google-address-field field" ref="google-address-field">
                    <input id="google-address" ref="address-input" type="text" name="google-address" value="" />
                    <label for="google-address">Street Address</label>
                </div>
                
            </div>
            <div class="form-fields">
                <slot></slot>
            </div>
        </div>
        `;
    }

    formInputs = {};
    #GOOGLE_API_KEY;

    constructor() {
        super();
        this.#GOOGLE_API_KEY = app.const.GOOGLE_API_KEY;
    }

    onAddressResults() {}

    hasAddress(saved = false) {
        this.resetAddress();
        this.ref("wrapper").classList.add("has-address");
        if (saved) {
            this.ref("wrapper").classList.add("saved-address");
        }
        this.savedAddress = saved;
    }

    resetAddress() {
        this.ref("wrapper").classList.remove("has-address");
        this.ref("wrapper").classList.remove("saved-address");
    }

    onReady() {
        const GOOGLE_API_KEY = this.#GOOGLE_API_KEY;

        for (let name in fieldAliases) {
            const aliases = fieldAliases[name].map((alias) => `[name*="${alias}"]`);
            const input = this.querySelector(aliases.join(", "));
            if (input) {
                this.formInputs[name] = input;
            }
        }

        app.log(this.formInputs);

        if (this.formInputs.address_line1.value !== "") {
            let currentAddress = `${this.formInputs.address_line1.value} ${
                this.formInputs.address_line2.value !== "" ? " " + this.formInputs.address_line2.value : ""
            }, `;
            currentAddress += `${this.formInputs.city.value}, ${this.formInputs.state.value} ${this.formInputs.zip.value} ${this.formInputs.country.value}`;
            this.ref("address-input").value = currentAddress;
            this.hasAddress(true);
        }

        Google.load("places").then((resp) => {
            const addressAutofill = Google.Location.autofill(this.ref("address-input"));

            addressAutofill.on("address", (_address) => {
                app.log(_address);
                for (let field in _address) {
                    app.log(field);
                    this.formInputs[field].value = _address[field];
                    this.formInputs[field].dispatchEvent(new Event("input", { bubbles: true }));
                }
                this.hasAddress();
                return false;
            });
            return false;
        });

        this.ref("address-input").addEventListener(
            "focus",
            () => {
                Google.Location.geolocate(() => {});
                if (this.savedAddress) {
                    this.hasAddress();
                }
            },
            false
        );
    }
}

customElements.define(GoogleAddressAutocomplete.tag, GoogleAddressAutocomplete);

class FormInfo extends CustomDom.HTMLElement {
    static tag = "form-info";

    static config = {
        emitter: true,
        properties: {
            error: { linked: true },
            warning: { linked: true },
            message: { linked: true },
        },
    };

    static get observedAttributes() {
        return ["error", "warning", "message", "description"];
    }

    static get observedProperties() {
        return ["error", "warning", "message", "description"];
    }

    static get style() {
        return {
            ":host": {
                marginTop: "1rem",
            },
            ".form-message .messages": {
                display: "none",
                flexDirection: "row",
                flexWrap: "nowrap",
                alignItems: "flex-end",
                paddingBottom: "1rem",
            },
            ".form-info.has-message .form-message .messages": {
                display: "flex",
            },
            ".form-message .messages .message:empty": {
                display: "none",
            },
            ".form-message": {
                marginBottom: "0",
                width: "100%",
                position: "relative",
            },
            ".description": {
                width: "75%",
            },
            ".has-error .description": {
                paddingBottom: "1rem",
            },
            ".has-error .description:empty": {
                display: "none",
            },
            ".form-info": {
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                alignItems: "center",
                paddingBottom: "1rem",
            },
            ".form-info .icon": {
                paddingRight: "1rem",
            },
            ".form-info .icon > *": {
                height: 0,
                width: 0,
                overflow: "hidden",
            },
            ".form-info .icon .error": {
                color: "#D41111",
            },
            ".form-info .icon .success": {
                color: "#73C322",
            },
            ".form-info .icon .warning": {
                color: "#FFAB1A",
            },
            ".form-info .message": {
                paddingTop: "1px",
                width: "100%",
            },
            ".form-info .message .error-message": {
                color: "#D41111",
            },
            ".form-info .message .warning-message": {
                color: "#FFAB1A",
            },
            ".form-info .actions": {
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                alignItems: "flex-end",
            },
            ".form-info .actions .action": {
                display: "none",
                paddingRight: "1rem",
                color: "#d2d2d2",
                cursor: "pointer",
            },
            ".form-info.has-history .actions .action": {
                display: "block",
            },
            ".form-info .actions .action:last-child": {
                paddingRight: 0,
            },
            ".form-info .actions .action.undo:hover": {
                color: "#FFAB1A",
            },
            ".form-info .actions .action.revert:hover": {
                color: "#D41111",
            },
            ".form-info .actions .action > div": {
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                alignItems: "center",
            },
            ".form-info .actions .action .btn-icon": {
                width: "20px",
                height: "20px",
            },
            ".form-info .actions .action .btn-label": {
                textTransform: "uppercase",
                fontWeight: "bold",
                lineHeight: "20px",
            },
            ":host([error]) .icon .error": {
                width: "auto",
                height: "auto",
            },
            ":host([warning]) .icon .warning": {
                width: "auto",
                height: "auto",
            },
            "::slotted(p:last-child)": {
                marginBottom: "0 !important",
            },
        };
    }

    static html() {
        const actionBtns = [
            {
                label: "undo",
                icon: `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
                <g fill="currentColor">
                <path fill="currentColor" d="M20.45,15.28V9.6c0-1.37-1.66-2.06-2.63-1.09L7.39,18.94c-0.6,0.6-0.6,1.58,0,2.18l10.43,10.43
            c0.97,0.97,2.63,0.28,2.63-1.09v-5.01c6.07,1.55,10.77,7.2,11.62,14.2c0.16,1.32,1.33,2.29,2.67,2.29h4.63
            c1.62,0,2.85-1.41,2.68-3.02C40.77,26.69,31.8,16.91,20.45,15.28z"></path>
                </g>
            </svg>`,
            },
            {
                label: "revert",
                icon: `
                <svg version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
                <g fill="currentColor">
                <path fill="currentColor" d="M27.67,6.98c-0.12-0.02-0.24-0.02-0.36-0.02V2.12c0-1.07-1.3-1.61-2.05-0.85L17.12,9.4c-0.47,0.47-0.47,1.23,0,1.7
            l8.13,8.13c0.76,0.76,2.05,0.22,2.05-0.85v-4.32c4.42,1.17,7.73,5.62,7.73,10.93c0,6.2-4.5,11.25-10.03,11.25
            c-4.96,0-9.09-4.05-9.89-9.35c-0.17-1.1-1.15-1.89-2.27-1.89h-2.4c-1.4,0-2.48,1.24-2.29,2.62c1.19,8.82,8.3,15.62,16.86,15.62
            c9.39,0,17.03-8.19,17.03-18.25C42.03,15.91,35.8,8.35,27.67,6.98z"></path>
                </g>
            </svg>`,
            },
        ];
        return `
        <div class="form-info" ref="wrapper">
            <div class="form-message">
                <div class="description"><slot></slot></div>
                <div class="messages">
                    <div class="icon">
                        <div class="error">
                            <ui-shape type="octagon" size="20" stroke-width="5" fill="currentColor" >
                                <status-icon ref="error-status-icon" size="20" color="#FFFFFF" ></status-icon>
                            </ui-shape> 
                        </div>
                        <div class="success">
                            <ui-shape type="circle" size="20" stroke-width="5" fill="currentColor" ></ui-shape>
                        </div>
                        <div class="warning">
                            <ui-shape type="triangle" size="20" stroke-width="5" fill="currentColor" ></ui-shape>
                        </div>
                    </div>
                    <div class="message">
                        <div ref="form-message" class="form-message"></div>
                        <div ref="error-message" class="error-message"></div>
                        <div ref="warning-message" class="warning-message"></div>
                    </div>
                </div>
            </div>
            
            <div class="actions">
                ${actionBtns
                    .map((btn) => {
                        return `
                        <a class="action ${btn.label}" click="actionClick('${btn.label}')" >
                            <div>
                                <div class="btn-icon">${btn.icon}</div>
                                <div class="btn-label">${btn.label}</div>
                            </div>
                        </a>
                    `;
                    })
                    .join(" \n ")}
            </div>
            </div>
        </div>
        `;
    }

    actionClick(e, action) {
        switch (action) {
            case "undo":
                this.form.undo();
                break;
            case "revert":
                this.form.fill(this.form.default);
                this.form.history.reset();
                break;
        }
        if (this.hooks[action]) {
            this.hooks[action]();
        }
    }

    hooks = {};

    hook(action, fn) {
        this.hooks[action] = fn;
    }

    bindForm(form) {
        form.history.on("notEmpty", () => {
            this.ref("wrapper").classList.add("has-history");
        });

        form.history.on("empty", () => {
            this.ref("wrapper").classList.remove("has-history");
        });

        this.form = form;
    }

    onReady() {}

    onPropertyChanged(property, old, value) {
        switch (property) {
            case "error":
                if (value !== null) {
                    this.ref("error-status-icon").setAttribute("state", "error");
                    this.ref("wrapper").classList.add("has-error");
                    this.ref("wrapper").classList.add("has-message");
                    this.ref("error-message").innerText = value;
                } else {
                    this.ref("error-status-icon").removeAttribute("state");
                    this.ref("wrapper").classList.remove("has-error");
                    this.ref("wrapper").classList.remove("has-message");
                    this.ref("error-message").innerText = "";
                }
                break;
            case "warning":
                this.ref("warning-message").innerText = value;
                if (value !== null) {
                    this.ref("error-status-icon").setAttribute("state", "warning");
                    this.ref("wrapper").classList.add("has-warning");
                    this.ref("wrapper").classList.add("has-message");
                    this.ref("warning-message").innerText = value;
                } else {
                    this.ref("error-status-icon").removeAttribute("state");
                    this.ref("wrapper").classList.remove("has-warning");
                    this.ref("wrapper").classList.remove("has-message");
                    this.ref("warning-message").innerText = "";
                }
                break;
            case "message":
                if (value !== null) {
                    this.ref("error-status-icon").setAttribute("state", "info");
                    this.ref("wrapper").classList.add("has-info");
                    this.ref("wrapper").classList.add("has-message");
                    this.ref("form-message").innerText = value;
                } else {
                    this.ref("error-status-icon").removeAttribute("state");
                    this.ref("wrapper").classList.remove("has-info");
                    this.ref("wrapper").classList.remove("has-message");
                    this.ref("error-message").innerText = "";
                }
                break;
        }
    }
}

customElements.define(FormInfo.tag, FormInfo);

class CustomFormInput extends CustomDom.HTMLElement {
    static config = {
        observe: true,
        emitter: true,
        properties: {
            name: { linked: true },
            type: { linked: true },
            value: { linked: true },
            label: { linked: true },
            default: { linked: true },
        },
    };

    static get observedAttributes() {
        return ["name", "value", "label", "default", "checked"];
    }

    static get observedProperties() {
        return ["name", "value", "label", "default", "checked"];
    }

    type = "text";

    createFormElement() {
        const inputWrapper = document.createElement("div");
        inputWrapper.setAttribute("slot", "hidden");

        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = this.type;

        inputWrapper.appendChild(input);
    }
}

class InputCheckbox extends CustomDom.HTMLElement {
    static tag = "input-checkbox";

    static config = {
        observe: true,
        emitter: true,
        properties: {
            size: { linked: true },
            value: { linked: true },
            label: { linked: true },
            default: { linked: true },
            selected: { linked: true },
        },
    };

    static get observedAttributes() {
        return ["size", "name", "value", "label", "default", "checked"];
    }

    static get observedProperties() {
        return ["size", "name", "value", "label", "default", "checked"];
    }

    static get style() {
        return [
            {
                ".component--html": {
                    marginRight: "1rem",
                },
                ".bg": {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#f3f3f3",
                    borderRadius: "15%",
                    overflow: "hidden",
                    transition: "all 0.5s ease",
                    cursor: "pointer",
                    border: "2px solid #d2d2d2",
                    color: "#d2d2d2",
                },
                /*'.bg:before': {
                content: `''`,
                display: 'block',
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '3px',
                transition: 'height 0.5s ease',
                height: '0px',
                background: '#d2d2d2',
                transform: 'translate(-50%, -50%) rotate(-45deg)'
            },
            '.bg:after': {
                content: `''`,
                display: 'block',
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '3px',
                transition: 'height 0.5s ease',
                height: '0px',
                background: '#d2d2d2',
                transform: 'translate(-50%, -50%) rotate(45deg)'
            },*/
                ":host(:not([checked])) .bg:before": {
                    width: "3px",
                    height: "100%",
                },
                ":host(:not([checked])) .bg:after": {
                    width: "3px",
                    height: "100%",
                },
                ":host([checked]) .bg": {
                    background: "#FFFFFF",
                    borderRadius: "50%",
                    color: "#73C322",
                    border: "2px solid #73C322",
                },
                'slot[name="hidden"]': {
                    height: 0,
                    width: 0,
                    overflow: "hidden",
                },
            },
        ];
    }

    static html() {
        return `
            <slot name="hidden"></slot>
            <div class="bg"><status-icon ref="status-icon" color="currentColor" size="37" ></status-icon></div>
        `;
    }

    type = "checkbox";

    onReady() {
        const inputWrapper = document.createElement("div");
        inputWrapper.setAttribute("slot", "hidden");
        const label = document.createElement("label");
        const input = document.createElement("input");
        this.input = input;
        input.type = "checkbox";

        label.appendChild(input);
        inputWrapper.appendChild(label);
        if (this.hasAttribute("checked")) input.checked = true;

        this.ref("html").addEventListener("click", () => {
            this.checked = !this.checked;
        });

        this.checked = this.hasAttribute("checked");
    }

    onPropertyChanged(property, old, value) {
        switch (property) {
            case "size":
                this.ref("html").style.width = `${value}px`;
                this.ref("html").style.height = `${value}px`;
                break;
            case "label":
                const label = document.createElement("span");
                label.innerText = this.label;
                this.appendChild(label);
                break;
            case "value":
                break;
            case "checked":
                if (value == true) {
                    this.setAttribute("checked", "");
                    this.ref("status-icon").setAttribute("state", "success");
                } else {
                    this.removeAttribute("checked");
                    this.ref("status-icon").setAttribute("state", "error");
                }
                this.dispatchEvent(new CustomEvent("change", { detail: { checked: value } }));
                break;
        }
    }
}

customElements.define(InputCheckbox.tag, InputCheckbox);