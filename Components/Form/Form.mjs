import FormInputs from "./FormInputs.mjs";
import Emitter from "../../Event/Emitter.mjs";
import { render } from "../../VirtualDom/VirtualDom.mjs";
import { load as loadSASS, loadFileToDocument as loadSASSFileToDocument } from "../../Style/SASS.mjs";
import Arr from "../../Util/Array.mjs";
//import inputCSS from `./sass/form--inputs.scss`;

const { _filename, dir: _dirname } = currentFile(import.meta);

class Form extends Emitter {
    static fromSchema(schema, container) {
        console.log(schema);
        const form = new Form(container);
        form.buildFromSchema(schema);
        return form;
    }

    inputs = {};

    constructor(container) {
        super();
        this.container = container;
    }

    buildFromSchema(schema) {
        const vdom = { tag: "div", attributes: { class: "form--schema" }, children: [] };
        for (let name in schema) {
            const type = schema[name].type;
            const input = FormInputs.fromSchema(name, schema[name]);
            vdom.children.push(input);
        }
        this.container.append(render(vdom));
        this.updateInputs();
    }

    onChange(name, value) {
        this.emit("change", name, value);
    }

    onInput(name, value) {
        this.emit("input", name, value);
    }

    updateInputs() {
        const self = this;
        const inputs = this.container.querySelectorAll("input, select, textarea");
        inputs.forEach((input) => {
            this.emit("change", input.name, input.value);
            if (!this.inputs[input.name]) {
                input.addEventListener("change", (e) => {
                    self.onChange(e.target.name, e.target.value);
                });
                input.addEventListener("input", (e) => {
                    self.onInput(e.target.name, e.target.value);
                });
                this.inputs[name] = input;
            }
        });
    }

    initialize() {
        this.on("listener", (event, fn) => {
            console.log(event, fn);
            switch (event) {
                case "change":
                    break;
            }
        });
    }
}

export default Form;
