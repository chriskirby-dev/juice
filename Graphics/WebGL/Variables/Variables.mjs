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
        if (!program) return false;
        gl.useProgram(program);
        // Ensure we have a valid location before attempting upload
        const loc = this.location;
        if (loc === null || loc === undefined || loc === -1) return false;

        // Drain any previous GL errors silently. A lingering GL error (e.g. INVALID_OPERATION)
        // can block uniform uploads; clearing old errors keeps upload behavior deterministic.
        try {
            let _e;
            while ((_e = gl.getError()) !== gl.NO_ERROR) {
                // intentionally empty: clear the GL error state
            }
        } catch (e) {
            // ignore getError failures
        }

        let v = this._value;
        if (settings.generate) v = settings.generate(this._value);

        const valArray = Array.isArray(v) ? v : [v];
        try {
            if (settings.setFn.endsWith("fv") && !settings.setFn.includes("Matrix")) {
                gl[settings.setFn](this.location, new Float32Array(valArray));
            } else if (settings.setFn.includes("Matrix")) {
                const args = valArray.slice();
                if (Array.isArray(args[args.length - 1]))
                    args[args.length - 1] = new Float32Array(args[args.length - 1]);
                gl[settings.setFn](this.location, ...args);
            } else {
                gl[settings.setFn](this.location, ...valArray);
            }
        } catch (e) {
            console.error(`Failed to upload uniform ${name}: ${e.message}`);
            return false;
        }
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error(`Failed to update uniform ${this.name}:`, error);
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