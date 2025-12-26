import VariableSettings from "./VariableSettings.mjs";
import VariableBase from "./VariableBase.mjs";
class InputAttribute extends VariableBase {
    static index = -1;
    constructor(...args) {
        super("in", ...args);
        this.constructor.index++;
        this.index = this.constructor.index;
    }

    lookupLocation() {
        if (!this.bound) return;
        const { gl } = this;
        this.location = gl.getAttribLocation(this.program, this.name);
        return this.location;
    }

    upload() {
        const { settings, gl } = this;
        if (!this.buffer) this.createBuffer();
        if (!this.buffer) {
            console.warn("Cant upload buffer before its created", this);
        }
        console.log("UPLOAD INPUT BUFFER", this.name, this._value.length);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._value), gl.DYNAMIC_DRAW);

        //gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    download() {
        const { settings, gl } = this;
        const data = new Float32Array(this._value.length);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.getBufferSubData(gl.ARRAY_BUFFER, 0, data);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return data;
    }

    bindBuffer() {
        const { settings, gl } = this;
        if (!this.buffer) this.createBuffer();
        console.log("Binding Input Buffer", this.name);
        //Bind Input for Reading
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(this.location);
        gl.vertexAttribPointer(this.location, 3, gl.FLOAT, false, 0, 0);
        console.log("Input Buffer Bound", this.name);
    }

    createBuffer() {
        const { settings, gl } = this;
        console.log("CREATE BUFFERS", this.name);
        this.buffer = gl.createBuffer();

        console.log("INIT READ BUFFER", this.name);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        if (this._value) {
            console.log("READ BUFFER DATA", this.name, this._value.length);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._value.length), gl.DYNAMIC_DRAW);
        }

        //Clean up
        console.log("CLEAN UP", this.name);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    onBound() {
        if (!this.buffer) {
            this.createBuffer();
        }
    }
}

export default InputAttribute;