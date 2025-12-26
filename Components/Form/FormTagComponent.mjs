import Component from "../Component.mjs";
import { BaseInput } from "./FormBaseComponents.mjs";
import Obj from "../../Util/Object.mjs";
//import setupCSS from "!../../../sass/component--setup.scss?toString";

class FormTagComponent extends Component.HTMLElement {
    static tag = "m-tag";

    static config = {
        shadow: true,
        closed: true,
        properties: {
            size: { linked: true, default: 45 },
            value: { linked: true },
            text: { linked: true },
            name: { linked: true },
            label: { linked: true },
        },
    };

    static get observed() {
        return {
            all: ["size", "value", "text", "name", "label"],
        };
    }

    static get style() {
        return [
            {
                ":host": {
                    position: "relative",
                    display: "inline-block",
                    background: "var(--color-blue)",
                    marginRight: "1rem !important",
                },
                ".component--html": {
                    height: "100%",
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    alignItems: "center",
                    justifyContent: "center",
                },
                ".delete": {
                    width: "90%",
                    height: "90%",
                    position: "relative",
                    color: "#333",
                    cursor: "pointer",
                },
                ".delete:hover .icon": {
                    backgroundColor: "var(--color-red)",
                    color: "#FFF",
                },
                ".icon": {
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    position: "absolute",
                    background: "#FFF",
                },
                ".text": {
                    color: "#FFF",
                },
                ".hidden": {
                    display: "none",
                },
            },
        ];
    }

    static html() {
        return `
        <div class="hidden"><slot></slot></div>
        <div class="delete" ref="delete" event="click::delete">
            <div class="icon">
                <svg class="xmark__svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <g stroke="currentColor">
                    <path class="xmark__x" fill="none" stroke-width="6" d="M 15,15 L 37,37"/>
                    <path class="xmark__x2" fill="none" stroke-width="6" d="M 37,15 L 15,37"/>
                    </g>
                </svg>
            </div>
        </div>
        <div class="text" ref="text"></div>
        `;
    }

    constructor() {
        super();
    }

    delete() {
        this.dispatchEvent(new CustomEvent("deleted"));
        this.parentNode.removeChild(this);
    }

    onReady() {}

    onPropertyChanged(prop, old, value) {
        switch (prop) {
            case "size":
                this.styles.replace({
                    ":host": {
                        height: value + "px",
                        borderRadius: value / 2 + "px",
                        paddingRight: value / 2 + "px",
                    },
                    ".delete": {
                        width: value * 0.8 + "px",
                        height: value * 0.8 + "px",
                        marginLeft: value * 0.1 + "px",
                        marginRight: value * 0.25 + "px",
                    },
                    ".text": {
                        fontSize: value * 0.6 + "px",
                    },
                });
                break;
            case "value":
                if (!this.label) this.ref("text").innerText = value;
                break;
            case "label":
                this.ref("text").innerText = value;
                break;
            case "name":
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = value + "[value][]";
                input.value = this.value || "";
                this.input = input;
                this.appendChild(input);

                const labelInput = document.createElement("input");
                labelInput.type = "hidden";
                labelInput.name = value + "[label][]";
                labelInput.value = this.label || "";
                this.labelInput = labelInput;
                this.appendChild(labelInput);
                break;
        }
    }
}

customElements.define(FormTagComponent.tag, FormTagComponent);