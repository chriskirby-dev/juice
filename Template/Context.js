function flatten(obj, prefix = "") {
    return Object.keys(obj).reduce((acc, key) => {
        const path = prefix == "" ? key : prefix + "." + key;
        if (typeof obj[key] === "object") {
            Object.assign(acc, flatten(obj[key], path));
        } else {
            acc[path] = obj[key];
        }
        return acc;
    }, {});
}

class TemplateContext {
    constructor(data, properties = {}) {
        this.properties = properties;
        this.data = data;
        this.bindings = new Map();
    }

    diff(newContext) {
        const { data: oldContext } = this;

        function diffLevel(oldData, newData) {
            const diff = {};
            for (const key in newData) {
                if (typeof newData[key] === "object") {
                    diff[key] = diffLevel(oldData[key], newData[key]);
                } else {
                    if (newData[key] !== oldData[key]) {
                        diff[key] = newData[key];
                    }
                }
            }
            return diff;
        }

        return flatten(diffLevel(oldContext, newContext));
    }

    update(data) {
        this.data = data;
    }

    set(property, value) {
        this.data[property] = value;
    }

    get(property) {
        if (property in this.data) return this.data[property];
        try {
            // Split the path into its parts
            const parts = property.split(".");

            // Recursively traverse the object and resolve the value
            return parts.reduce((acc, part) => acc?.[part], this.data);
        } catch {
            // If the path is invalid, return an empty string
            return "";
        }
    }

    bind(property, token) {
        if (!this.bindings.has(property)) this.bindings.set(property, []);
        this.bindings.get(property).push({ token });
    }
}

export default TemplateContext;
