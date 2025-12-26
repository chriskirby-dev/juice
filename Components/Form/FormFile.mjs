/**
 * File upload form component with custom styling.
 * @module Components/Form/FormFile
 */
import Component from "../Component.mjs";

/**
 * File input component with styled file selector button.
 * @class FormFile
 * @extends Component.HTMLElement
 */
class FormFile extends Component.HTMLElement {
    static tag = "form-file";

    static config = {
        name: "form-file",
        tag: "form-file",
        properties: {
            label: { linked: true, default: "Files" },
            value: { linked: true, default: "", type: "string" },
            name: { type: "string", default: "file", linked: true },
            accept: { type: "string", default: "image/*", linked: true },
        },
    };

    static get observed() {
        return {
            all: ["name", "accept", "label"],
        };
    }

    static get style() {
        return [
            +{
                ":host": {
                    display: "block",
                },
                '::slotted(input[type="file"])': {
                    border: "1px solid rgba(0, 0, 0, 0.16)",
                    padding: "10px",
                },
                '::slotted(input[type="file"]::file-selector-button)': {
                    borderRadius: "4px",
                    padding: "0 16px",
                    height: "40px",
                    cursor: "pointer",
                    backgroundColor: "white",
                    boxShadow: "0px 1px 0px rgba(0, 0, 0, 0.05)",
                    marginRight: "16px",
                    transition: "background-color 200ms",
                },
                '::slotted(input[type="file"]::file-selector-button:hover )': {
                    backgroundColor: "#f3f4f6",
                },
                '::slotted(input[type="file"]::file-selector-button:active)': {
                    backgroundColor: "#e5e7eb",
                },
            },
        ];
    }

    static html() {
        return `
        <slot></slot>
        <div ref="value" class="value">
            <span>${this.value}</span>  
        </div>
    `;
    }

    static get observed() {
        return {
            all: ["name", "accept", "value"],
        };
    }

    onPropertyChange(property, old, value) {
        switch (property) {
            case "value":
                this.ref("html").classList.toggle("empty", value == "");
                break;
            default:
                break;
        }
    }

    onFirstConnect() {
        if (this.hasAttribute("value") && this.value !== "") {
            this.classList.toggle("empty", false);
        } else {
            this.classList.toggle("empty", true);
        }
        if (!this.built) {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.name = this.name;
            fileInput.multiple = this.multiple;
            fileInput.accept = this.accept;
            fileInput.addEventListener("change", (e) => {
                this.classList.toggle("empty", e.target.files.length == 0);
                this.dispatchEvent(new CustomEvent("change", { detail: e.target.files }));
            });

            this.appendChild(fileInput);
            this.built = true;
        }
    }
}

customElements.define(FormFile.tag, FormFile);

export default FormFile;

class FormFiles extends Component.HTMLElement {
    static tag = "form-files";

    static config = {
        name: "form-files",
        tag: "form-files",
        properties: {
            label: { linked: true, default: "Files", type: "string" },
            name: { type: "string", default: "files", linked: true },
            multiple: { type: "boolean", default: false, linked: true },
            accept: { type: "string", default: "image/*", linked: true },
        },
    };

    static get observed() {
        return {
            all: ["name", "multiple", "accept", "label"],
        };
    }

    static get style() {
        return [
            {
                ":host": {
                    display: "block",
                    border: "1px solid rgba(0, 0, 0, 0.16)",
                    backgroundColor: "#f3f3f3",
                    padding: "1rem",
                },
                h3: {
                    margin: "0 0 0.5rem 0",
                },
                "#list": {
                    border: "1px solid rgba(0, 0, 0, 0.16)",
                    backgroundColor: "white",
                    minHeight: "40px",
                },
            },
        ];
    }

    static html() {
        return `
        <h3>${this.label}</h3>
        <div id="list">
         <slot></slot>
        </div>
    `;
    }

    createFileInput() {
        const fileInput = document.createElement("form-file");
        this.inputs.push(fileInput);
        fileInput.name = this.name + "[]";
        fileInput.multiple = this.multiple;
        fileInput.accept = this.accept;
        return fileInput;
    }

    bindInput(input) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("item");
        wrapper.innerHTML = `<a class="delete"><span>X</span></a>`;
        wrapper.appendChild(input);
        this.appendChild(wrapper);

        input.addEventListener("change", (e) => {
            const files = e.detail;
            this.dispatchEvent(new CustomEvent("change", { detail: files }));
            if (files && files.length) this.appendChild(this.bindInput(this.createFileInput()));
        });

        return wrapper;
    }

    onFirstConnect() {
        this.inputs = Array.from(this.children || []);
        this.inputs.forEach(this.bindInput.bind(this));

        this.appendChild(this.bindInput(this.createFileInput()));

        this.styles.add(
            {
                [FormFiles.tag + " .item"]: {
                    display: "block",
                    position: "relative",
                    width: "100%",
                    padding: "10px",
                    minHeight: "40px",
                },
                [FormFiles.tag + " .item:not(:last-child)"]: {
                    borderBottom: "1px solid rgba(0, 0, 0, 0.16)",
                },
                [FormFiles.tag + " .item .delete"]: {
                    display: "block",
                    float: "right",
                    height: "100%",
                    padding: "0 1rem",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    position: "absolute",
                    cursor: "pointer",
                },
                [FormFiles.tag + " .item .delete span"]: {
                    display: "block",
                    fontWeight: "bold",
                    position: "relative",
                    top: "50%",
                    transform: "translateY(-50%)",
                },
                [FormFiles.tag + " .item .delete:hover span"]: {
                    color: "red",
                },
            },
            "global"
        );
    }
}

customElements.define(FormFiles.tag, FormFiles);