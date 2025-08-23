import VariableBase from "./VariableBase.mjs";

import { checkGLError } from "../Lib/Helper.mjs";

class Attribute extends VariableBase {
    constructor(...args) {
        super("attribute", ...args);
        this.constructor.index++;
    }
}

export class Uniform extends VariableBase {
    constructor(...args) {
        super("uniform", ...args);
        this.constructor.index++;
    }

    download() {
        if (!this.location) return;
        return this.gl.getUniform(this.program, this.location);
    }

    upload() {
        const { gl, program, name, settings } = this;
        gl.useProgram(program);
        if (!this.locationn && !this.lookupLocation()) {
            return console.warn("Cant upload buffer without loc", this.location, this.name);
        }

        let v = this._value;
        if (settings.generate) {
            v = settings.generate(this._value);
        }
        if (this.type === "bool") {
        }
        if (this.options.debug) {
            console.log("UPLOAD UNIFORM", this.name, v);
        }
        gl[settings.setFn](this.location, ...(Array.isArray(v) ? v : [v]));
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error(`Failed to update uniform ${this.name} :`, error);
            return false;
        }
        return true;
    }
}

class Varying extends VariableBase {
    constructor(...args) {
        super("varying", ...args);
        this.constructor.index++;
    }
}

class InputAttribute extends Attribute {
    constructor(...args) {
        super("in", ...args);
        this.constructor.index++;
    }
}

class OutputAttribute extends Attribute {
    constructor(...args) {
        super("out", ...args);
        this.constructor.index++;
    }
}
