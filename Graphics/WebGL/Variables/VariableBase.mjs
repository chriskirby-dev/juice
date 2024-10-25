import VariableSettings from "./VariableSettings.mjs";

class VariableBase {
    static indexMap = new Map();
    static webgl;
    static gl;

    static setGL(gl) {
        this.gl = gl;
    }

    constructor(qualifier, name, type, value, options = {}) {
        this.qualifier = qualifier;
        this.name = name;
        this.type = type;
        this._value = value;

        if (options.location !== undefined) {
            this.location = options.location;
        }

        this.settings = VariableSettings[type];
        // if (this.constructor.gl) this.linkGL(this.constructor.webgl || this.constructor.gl);
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
            (this.location !== undefined ? `layout(location = ${this.location}) ` : "") + this.qualifier,
            this.name,
            this.type
        );
    }

    get definition() {
        return (
            (this.location !== undefined ? `layout(location = ${this.location}) ` : "") +
            `${this.qualifier} ${this.type} ${this.name};`
        );
    }

    set value(value) {
        //  console.log("Setting value", this.qualifier, this.name, value);
        if (value === this._value) return;
        this._value = value;
        if (this.bound) return this.upload();
        return false;
    }

    get value() {
        return this._value;
    }

    bind(gl, program) {
        if (this.bound) return this;
        // console.log("On Bind", gl, program, this.name, this._value);

        this.gl = gl;
        this.program = program;
        if (!VariableBase.indexMap.has(this.program)) {
            VariableBase.indexMap.set(this.program, {});
        }
        //Get or Set Map for program
        const programMap = VariableBase.indexMap.get(this.program);
        if (!programMap[this.qualifier]) {
            programMap[this.qualifier] = [];
        }
        programMap[this.qualifier].push(this);

        this.index = programMap[this.qualifier].indexOf(this);

        this.bound = true;
        if (this.lookupLocation) this.lookupLocation();
        //if value is set reset and upload it
        if (this._value !== undefined) {
            const v = this._value;
            this._value = null;
            this.value = v;
        }
        if (this._value) console.log("Download", this.name, this.location, this.download());
        if (this.onBound) this.onBound(gl, program);
        return this;
    }
}

export default VariableBase;
