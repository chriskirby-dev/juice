class ProtectedScope {
    constructor(instance) {
        this.instance = instance;
        const bag = {};
    }
}

export function copyProperties(target, source) {
    for (const key of Reflect.ownKeys(source)) {
        if (key !== "constructor" && key !== "prototype" && key !== "name") {
            const desc = Object.getOwnPropertyDescriptor(source, key);
            Object.defineProperty(target, key, desc);
        }
    }
}
class ClassUtil {
    static setupConstructor(constructor) {
        const props = Object.getOwnPropertyNames(constructor);
        app.log(props);
        for (let property of props) {
            let name;
            app.log(property, constructor[property]);
        }
    }

    static setupPrototype(proto) {
        // proto.#test = 'test';

        proto._ = new ProtectedScope();

        function accessProtected(property) {
            return this[`#${property}`] || null;
        }

        accessProtected.bind(proto);

        proto.protected = accessProtected;

        const props = Object.getOwnPropertyNames(proto);
        app.log(props);
        for (let property of props) {
            let name;
            app.log(property, constructor[property]);
        }
    }

    static setupModifiers(instance) {
        const props = Object.getOwnPropertyNames(instance);
        app.log(props);
        for (let property of props) {
            let name;
            app.log(property, instance.property);
            if (property.indexOf("__") === 0) {
                //Protected Read Only Varible
                name = property.substring(2);
                Object.defineProperty(instance, property.substring(1), {
                    get: function () {
                        return this[property];
                    },
                });
            } else if (property.charAt(0) === "_") {
                //Protected Varible
                name = property.substring(1);
                Object.defineProperty(instance, property.substring(1), {
                    get: function () {},
                });
            }

            function accessProtected(property) {
                return this[`#${property}`] || null;
            }

            instance.bind(accessProtected);

            instance.protected = accessProtected;
        }
    }
}

export default ClassUtil;
