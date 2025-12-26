import FormInputProperties from "./FormInputProperties.mjs";

class FormInput extends FormInputProperties {
    static fromDom(element) {
        const name = element.name;
        let type;
        if (element.tagName === "input") {
            type = element.type;
        }
    }

    constructor(name, type) {
        super();
        this._ = {
            savedValue: "",
        };
        this.name = name;
        this.type = type;
    }

    clean() {
        return (this._.dirty = false);
    }

    get rules() {
        return [];
    }

    validate() {}

    clear() {
        this.value = "";
    }

    focus() {
        return this.element.focus();
    }

    initialize() {
        this.element.addEventListener("input", (e) => {
            this.value = e.target.value;
            this._.dirty = true;
        });

        this.element.addEventListener("change", () => {
            this.value = e.target.value;
            this._.dirty = true;
        });
    }

    build() {
        const descriptor = {
            name: this.name,
            type: this.type,
        };
    }
}