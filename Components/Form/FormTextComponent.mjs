import Component from "../Component.mjs";
import Attributes from "../../Dom/Attributes.mjs";
import { BaseInput } from "./FormBaseComponents.mjs";

class FormTextComponent extends BaseInput {
    static tag = "form-text";

    static config = {
        properties: {},
    };

    static observed() {
        return {
            attributes: [],
        };
    }

    static get style() {
        return super.style.concat([
            {
                ":host": {
                    width: "100%",
                    display: "block",
                    flex: "1 1 auto",
                },
                label: {
                    zIndex: 500,
                    border: "1px solid transparent",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    paddingTop: "0.5rem",
                    paddingLeft: "0.8rem",
                    paddingRight: "0.8rem",
                    display: "block",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    transition: "all 0.4s ease 0s",
                    whiteSpace: "nowrap",
                },
                input: {
                    fontSize: "1rem",
                    lineHeight: 1.6,
                    fontFamily: "Inter, Open Sans, Segoe UI, sans-serif",
                    border: "1px solid var(--input-border)",
                    borderRadius: "var(--input-border-radius) !important",
                    background: "rgb(243,243,243)",
                    background: "var(--input-bg)",
                    width: "100%",
                    paddingLeft: "0.8rem",
                    paddingTop: "0.25rem",
                    paddingTop: "1.5rem",
                    paddingBottom: "0.25rem",
                },
                ":host([disabled]) input": {
                    backgroundColor: "#bbbbbb !important",
                    color: "#636363",
                    fill: "#7a7a7a",
                    paddingRight: "2.5rem",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='25' viewBox='0 0 141.18 197.56'%3E%3Cg fill='%237a7a7a'%3E%3Cpath d='M304.59 265.65c0 5.12-.09 10.23.05 15.33a7.67 7.67 0 0 0 1.22 3.93c22 32.07 14.91 74.8-16.18 97.51-41 29.93-99.56 7.89-110.48-41.69-4.44-20.16-.38-38.77 11.1-55.86a7.32 7.32 0 0 0 1.2-3.73c.16-10-.12-20 .31-30 1.11-25.38 21.21-47.7 46.32-51.84 30.52-5 58.53 13.69 65.07 43.82 1.2 5.53 1 11.36 1.38 17.06.12 1.83 0 3.67 0 5.51Zm-21.26 16c0-9.07 0-17.45 0-25.83.09-21-16-36.68-37-36.12-16.89.45-32.13 14.58-33.18 31.41-.61 9.84-.26 19.75-.33 29.62 0 .15.19.3.39.57 9.89-9.13 21.65-12.54 34.89-12.53S273.07 272.24 283.33 281.66Zm-35.22 22.66a13.92 13.92 0 0 0-13.34 9.55 13.64 13.64 0 0 0 4.75 15.5 3.46 3.46 0 0 1 1.53 3.23c-.07 6.74 0 13.48 0 20.22 0 2.83.88 5.23 3.43 6.76 4.88 2.93 10.58-.5 10.65-6.47.07-6.8.05-13.61 0-20.42a3.7 3.7 0 0 1 1.62-3.4 13.69 13.69 0 0 0 4.64-15.54A14 14 0 0 0 248.11 304.32Z' transform='translate(-177.44 -198.44)'%3E%3C/path%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundPosition: "calc(100% - 10px) center",
                    backgroundRepeat: "no-repeat",
                },
            },
        ]);
    }

    static html() {
        const self = this;
        this.attrs.set("name", self.name);
        this.attrs.set("value", self.value);
        this.attrs.set("placeholder", self.placeholder);
        return this.wrapper(`
            <input ref="input" id="input" type="text" ${this.attrs.toString()} />
        `);
    }

    onPropertyChanged(property, old, value) {
        switch (property) {
            case "label":
                this.ref("label").innerText = old;
                break;
        }
    }

    onReady() {
        this.ref("input").addEventListener("input", () => {
            this.value = this.ref("input").value;
        });
        if (this.hasAttribute("label")) {
            this.ref("label").innerText = this.getAttribute("label");
        }
    }

    beforeFirstRender() {
        this.attrs = new Attributes();
        super.beforeFirstRender();
    }

    onValueChange(value) {}
}

customElements.define(FormTextComponent.tag, FormTextComponent);