import { checkGLError } from "../Lib/Helper.mjs";
import VariableSettings from "./VariableSettings.mjs";

export const StorageQualifiers = {
    ATTRIBUTE: "attribute",
    UNIFORM: "uniform",
    VARYING: "varying",
    IN: "in",
    OUT: "out",
    INOUT: "inout",
    CONST: "const",
    SHARED: "shared"
};

const QUALIFIER_VALUES = Object.values(StorageQualifiers);

class VariableBase {
    static qualifiers = QUALIFIER_VALUES;

    static indexMap = new Map();
    static webgl;
    static gl;

    static setGL(gl) {
        this.gl = gl;
    }

    /**
     * @param {string} qualifier - The variable qualifier, e.g. 'attribute', 'uniform', 'varying'.
     * @param {string} name - The variable name.
     * @param {string} type - The variable type, e.g. 'float', 'vec2', 'mat4'.
     * @param {*} value - The variable value, e.g. a number, an array of numbers, a matrix.
     * @param {Object} [options] - Additional options, e.g. the location of the variable in the shader.
     * @constructor
     */
    constructor(qualifier, name, type, value, options = {}) {
        this.qualifier = qualifier;
        this.name = name;
        this.type = type;
        this._value = value;
        this._location = null;
        this._locationId = options.location !== undefined ? options.location : null;
        this.options = options;
        this.settings = VariableSettings[type] || {};
        this.LOCATION_LOOKUP = `get${qualifier[0].toUpperCase()}${qualifier.slice(1).toLowerCase()}Location`;
        this.LOOKUP_TYPE =
            this.LOCATION_LOOKUP === "getUniformLocation" ? WebGLRenderingContext.UNIFORM : WebGLUniformLocation;
    }

    linkGL(webgl) {
        if (webgl instanceof WebGLRenderingContext) {
            this.gl = webgl;
        } else if (this.constructor.gl) {
            this.gl = this.constructor.gl;
        }
    }

    define(builder) {
        builder.define(
            (this._locationId !== null ? `layout(location = ${this._locationId}) ` : "") + this.qualifier,
            this.name,
            this.type
        );
    }

    get definition() {
        return (
            (this._locationId !== null ? `layout(location = ${this._locationId}) ` : "") +
            `${this.qualifier} ${this.type} ${this.name};`
        );
    }

    lookupLocation() {
        if (!this.bound) return;
        const { gl, program, name } = this;
        gl.useProgram(program);
        this._location = gl[this.LOCATION_LOOKUP](program, name);
        if (this._location === null) {
            this.lookupError = true;
            console.error(`Uniform "${name}" not found in shader.`);
        }
        return this._location;
    }

    set value(value) {
        if (this.options.debug) console.log("Attempting to set value", this.name, value, "from", this._value);
        //  console.log("Setting value", this.qualifier, this.name, value);
        if (value === this._value) {
            if (this.options.debug) console.log(`Aborting Setting ${this.name} Value already set`);
            return;
        }
        this._value = value;
        if (this.options.debug) console.log("Uploading Value", this.qualifier, this.name, value);
        // Ensure we have a location; attempt a lookup if not present
        if (this._location === null) {
            const loc = this.location; // triggers lookupLocation if bound
            if (loc === null || loc === undefined) {
                if (this.options.debug) console.error(`Variable ${this.name} has no location.`);
                return false;
            }
        }
        if (this.bound && this.upload) return this.upload();

        return true;
    }

    get value() {
        return this._value;
    }

    get location() {
        if (this._location !== null) return this._location;
        if (this.lookupLocation) return this.lookupLocation();
    }

    set location(value) {
        this._location = value;
    }

    /**
     * Binds the variable to the given WebGL context and program.
     * It ensures that the variable is only bound once, associates it with
     * the program, and uploads its value if set.
     *
     * @param {WebGLRenderingContext} gl - The WebGL context.
     * @param {WebGLProgram} program - The WebGL program to which the variable is bound.
     * @returns {VariableBase} The current instance for chaining.
     */
    bind(gl, program) {
        if (this.bound) return this; // Return if already bound
        this.gl = gl;
        this.program = program;

        if (!VariableBase.indexMap.has(this.program)) {
            VariableBase.indexMap.set(this.program, {});
        }

        const programMap = VariableBase.indexMap.get(this.program);
        if (!programMap[this.qualifier]) programMap[this.qualifier] = [];

        programMap[this.qualifier].push(this);
        this.index = programMap[this.qualifier].indexOf(this);

        this.bound = true;

        // Attempt to resolve location immediately after binding
        try {
            this.lookupLocation();
        } catch (e) {
            // ignore lookup errors here
        }

        // Trigger any additional logic required upon binding
        if (this.onBound) this.onBound(gl, program);

        // If a value is set, reset and upload it
        if (this._value !== undefined) {
            const tmp = this._value;
            this._value = null;
            this.value = tmp;
        }

        return this; // Return the instance for chaining
    }
}

export default VariableBase;