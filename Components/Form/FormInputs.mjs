import { VirtualDom, vElement } from "../../VirtualDom/VirtualDom.mjs";
import Str from "../../Util/String.mjs";
import Arr from "../../Util/Array.mjs";
import InputName from "./InputName.mjs";
export function datalist() {
    const list = vElement("datalist", {}, []);
}

const ATTTRIBUTED_PROPERTIES = [
    "type",
    "value",
    "name",
    "placeholder",
    "checked",
    "disabled",
    "required",
    "readonly",
    "min",
    "max",
];

class FormInputs {
    static fromSchema(name, properties) {
        let input;
        name = new InputName(name);
        const { type, attributes = {}, value = "" } = properties;
        attributes.name = name;

        const attributedProps = Arr.intersect(ATTTRIBUTED_PROPERTIES, Object.keys(properties));
        for (let prop of attributedProps) {
            //Shift Property to Attributes
            if (attributes[prop] !== undefined) continue;
            attributes[prop] = properties[prop];
            delete properties[prop];
        }

        if (!attributes.id) attributes.id = name.toId();
        if (!properties.hasOwnProperty("label")) properties.label = name.toLabel();

        if (FormInputs[type]) {
            input = FormInputs[type](name, value, attributes, properties);
        } else {
            input = FormInputs.input(type, name, value, attributes, properties);
        }

        return input;
    }

    static datalist(id, options = []) {
        return vElement(
            "datalist",
            {
                id: id,
            },
            []
        );
    }

    static hidden(name, value, attributes = {}) {
        return vElement("input", attributes);
    }

    static options(type, name, value, attributes, options = []) {
        let container;

        if (type == "select") {
            container = vElement("select", attributes, []);
        }

        for (let i = 0; i < options.length; i++) {
            container.children.push(vElement("option", { value: options[i] }, [options[i]]));
        }

        return container;
    }

    static select(name, value, attributes = {}, properties) {
        return this.options("select", name, value, attributes, properties.options);
    }

    static checkbox(name, value, attributes = {}, properties = {}) {
        return vElement(
            "label",
            {
                for: attributes[id],
            },
            [vElement("span", {}, [properties.label || FormInputs.nameToLabel(name)]), vElement("input", attributes)]
        );
    }

    static checkboxes(name, values, attributes = {}) {
        const wrapper = vElement("div", {}, []);
        for (let i = 0; i < values.length; i++) {
            wrapper.children.push(this.checkbox(`${name}[]`, values[i]));
        }
        return wrapper;
    }

    static radio(name, value, attributes = {}, properties = {}) {
        return vElement(
            "label",
            {
                for: attributes[id],
            },
            [vElement("span", {}, [properties.label || FormInputs.nameToLabel(name)]), vElement("input", attributes)]
        );
    }

    static number(name, value, attributes = {}, properties = {}) {
        return vElement("input", attributes);
    }

    static text(name, value, attributes = {}) {
        attributes.name = name;
        attributes.value = value;
        return this.input("text", attributes, value);
    }

    static textarea(name, value, attributes = {}, properties = {}) {
        delete attributes.value;
        return vElement(
            "textarea",
            {
                id: FormInputs.nameToId(name),
                type,
                name,
            },
            [value]
        );
    }

    static range(name, value, attributes = {}, options = {}) {
        return this.input("range", name, value, attributes, options);
    }

    static date(name, value, attributes = {}) {
        attributes.name = name;
        attributes.value = value;
        return this.input("date", attributes);
    }

    static datetime(name, value, attributes = {}) {
        attributes.name = name;
        attributes.value = value;
        return this.input("datetime", attributes);
    }

    static input(type, name, value, attributes = {}, options = {}) {
        return [
            vElement("label", { for: attributes.id }, [options.label || name.toLabel()]),
            vElement("input", attributes, [], null, options),
        ];
    }

    static submit(text = "Submit", attributes = {}) {
        attributes.type = "submit";
        attributes.value = text;
        return this.input("submit", attributes);
    }

    static fromObjectDescriptor(descriptor) {}
}

export default FormInputs;
