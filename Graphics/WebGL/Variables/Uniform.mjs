import VariableSettings from "./VariableSettings.mjs";
import VariableBase from "./VariableBase.mjs";
import { checkGLError } from "../Lib/Helper.mjs";
class Uniform extends VariableBase {
    constructor(...args) {
        super("uniform", ...args);
    }

    lookupLocation() {
        if (!this.bound) return;
        const { gl, program, name } = this;
        gl.useProgram(program);
        this.location = gl.getUniformLocation(program, name);
        if (!this.location) {
            console.warn("Failed to get uniform location:", name);
        }
        return this.location;
    }

    download() {
        if (!this.location) return;
        return this.gl.getUniform(this.program, this.location);
    }

    upload() {
        const { settings, gl, program } = this;
        if (!this.location) {
            this.lookupLocation();
            return console.warn("Cant upload buffer without loc", this.location, this.name);
        }

        let v = this._value;
        if (settings.generate) {
            v = settings.generate(this._value);
        }
        if (this.type === "bool") {
        }
        console.log("UPLOAD UNIFORM", this.name, v);
        gl[settings.setFn](this.location, ...(Array.isArray(v) ? v : [v]));
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error("Failed to update uniform:", error);
            return false;
        }
        return true;
    }
}

export default Uniform;
