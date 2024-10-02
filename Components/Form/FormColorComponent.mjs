import Component from "../Component.mjs";
import { BaseInput } from "./FormBaseComponents.mjs";
//import setupCSS from "!../../../sass/component--setup.scss?toString";

class FormColorComponent extends BaseInput {
    static tag = "form-color";

    static config = {
        shadow: true,
        closed: true,
        properties: {
            size: { linked: true, default: 45 },
        },
    };

    static get observed() {
        return {
            attributes: ["size"],
            properties: ["size"],
        };
    }

    static get style() {
        return [
            setupCSS,
            {
                "*": {
                    boxSizing: "content-box",
                },
                ".swatch": {
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: "2px solid #d2d2d2",
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                },
                ".swatch input": {
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    opacity: 0,
                    cursor: "pointer",
                    zIndex: 100,
                },
                slot: {
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    textAlign: "center",
                },
                "::slotted(*)": {
                    margin: "0 auto !important",
                },
            },
        ];
    }

    static html() {
        return `
            <div ref="swatch" class="swatch" style="background-color: ${this.value}">
                <input ref="native" type="color" value="${this.value}" />
                <slot></slot>
            </div>
        `;
    }

    onReady() {
        this.ref("native").addEventListener("input", (e) => {
            this.value = this.ref("native").value;
            this.ref("swatch").style.backgroundColor = this.ref("native").value;
        });

        this.value = this.ref("native").value;
    }

    onAttributeChanged(prop, old, value) {
        switch (prop) {
            case "size":
                this.styles.replace({
                    ":host": {
                        width: value + "px",
                        height: value + "px",
                    },
                });
                break;
        }
    }
}

customElements.define(FormColorComponent.tag, FormColorComponent);
