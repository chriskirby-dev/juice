/**
 * ProtectedScope class provides a protected scope container for class instances.
 * Used to manage protected properties that should not be directly accessible.
 * @class ProtectedScope
 * @private
 */
class ProtectedScope {
    /**
     * Creates a new protected scope for a class instance.
     * @param {Object} instance - The instance to create protected scope for
     */
    constructor(instance) {
        this.instance = instance;
        const bag = {};
    }
}

/**
 * Copies properties from source object to target object, excluding constructor, prototype, and name.
 * Preserves property descriptors (getters, setters, enumerability, etc.).
 * @param {Object} target - The target object to copy properties to
 * @param {Object} source - The source object to copy properties from
 * @example
 * copyProperties(targetObj, sourceObj);
 */
export function copyProperties(target, source) {
    for (const key of Reflect.ownKeys(source)) {
        if (key !== "constructor" && key !== "prototype" && key !== "name") {
            const desc = Object.getOwnPropertyDescriptor(source, key);
            Object.defineProperty(target, key, desc);
        }
    }
}
/**
 * ClassUtil provides utility methods for working with JavaScript classes.
 * Includes methods for managing protected properties and setting up class modifiers.
 * @class ClassUtil
 */
class ClassUtil {
    /**
     * Sets up the constructor of a class by analyzing and logging its properties.
     * @param {Function} constructor - The constructor function to set up
     * @static
     */
    static setupConstructor(constructor) {
        const props = Object.getOwnPropertyNames(constructor);
        app.log(props);
        for (let property of props) {
            let name;
            app.log(property, constructor[property]);
        }
    }

    /**
     * Sets up the prototype of a class with protected scope accessors.
     * Creates a protected property accessor function on the prototype.
     * @param {Object} proto - The prototype object to set up
     * @static
     */
    static setupPrototype(proto) {
        // proto.#test = 'test';

        proto._ = new ProtectedScope();

        /**
         * Accesses a protected property on the instance.
         * @param {string} property - The property name to access
         * @returns {*} The value of the protected property, or null if not found
         */
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

    /**
     * Sets up property modifiers on a class instance based on naming conventions:
     * - Properties starting with "__" are protected read-only variables
     * - Properties starting with "_" are protected variables
     * Creates getter properties for protected members.
     * @param {Object} instance - The class instance to set up modifiers for
     * @static
     */
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

            /**
             * Accesses a protected property on the instance.
             * @param {string} property - The property name to access
             * @returns {*} The value of the protected property, or null if not found
             */
            function accessProtected(property) {
                return this[`#${property}`] || null;
            }

            instance.bind(accessProtected);

            instance.protected = accessProtected;
        }
    }
}

export default ClassUtil;
