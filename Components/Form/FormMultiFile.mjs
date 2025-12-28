/**
 * Multi-file upload form component.
 * Provides file input with multiple file selection support.
 * @module Components/Form/FormMultiFile
 */

import Component from "../Component.mjs";

/**
 * Form component for multiple file uploads.
 * @class FormMultiFile
 * @extends Component.HTMLElement
 */
class FormMultiFile extends Component.HTMLElement {
    static tag = "form-files";

    static config = {
        name: "form-files",
        tag: "form-files",
        properties: {
            name: { type: "string", default: "files" },
            multiple: { type: "boolean", default: false },
            accept: { type: "string", default: "image/*" },
        },
    };

    static get observed() {
        return {
            all: ["name", "multiple", "accept"],
        };
    }

    static get style() {
        return [
            {
                ":host": {
                    display: "block",
                },
                "::slotted(.file-btn)": {
                    display: "inline-block",
                    position: "relative",
                    overflow: "hidden",
                    verticalAlign: "top",
                    cursor: "pointer",
                },
                "::slotted(.file-btn input)": {
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    opacity: "0",
                    cursor: "pointer",
                },
                "::slotted(.file-btn span)": {
                    display: "inline-block",
                    verticalAlign: "top",
                },
            },
        ];
    }

    addFile() {
        //Add File Input
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.name = this.name + "[]";
        fileInput.multiple = this.multiple;
        fileInput.accept = this.accept;
        fileInput.addEventListener("change", (e) => {
            this.dispatchEvent(new CustomEvent("change", { detail: e.target.files }));
        });

        const btnText = document.createElement("span");
        btnText.innerText = "Add File";

        const fileBtn = document.createElement("div");
        fileBtn.classList.add("file-btn");
        fileBtn.setAttribute("part", "file-btn");

        fileBtn.appendChild(btnText);
        fileBtn.appendChild(fileInput);

        this.appendChild(fileBtn);
    }

    static html() {
        return `<slot></slot>`;
    }

    onFirstConnect() {
        this.addFile();
    }
}

export default FormMultiFile;

customElements.define(FormMultiFile.tag, FormMultiFile);