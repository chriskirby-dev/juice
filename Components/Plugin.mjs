class ComponentPlugin {
    static strategy = "copy";

    constructor(host) {
        this.host = host;
        this.apply();
    }

    extend(...Plugins) {
        Plugins.forEach((Plugin) => {
            new Plugin(this);
        });
    }

    apply() {
        const properties = Object.getOwnPropertyNames(this.constructor.prototype);
        properties.filter((prop) => !["constructor", "strategy"].includes(prop));

        for (let prop of properties) {
            this.host[prop] = this[prop];
        }

        const staticProperties = Object.getOwnPropertyNames(this.constructor);
        staticProperties.filter((prop) => !["constructor", "prototype"].includes(prop));

        for (let staticProp of staticProperties) {
            this.host.constructor[prop] = this.constructor[prop];
        }
    }
}