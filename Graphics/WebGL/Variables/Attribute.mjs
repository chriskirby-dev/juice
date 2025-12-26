import WebGL from "../Lib/WebGL.mjs";
import VariableSettings from "../Lib/VariableSettings.mjs";
import VariableBase from "../Lib/VariableBase.mjs";
export class Attribute extends VariableBase {
    constructor(name, type, value) {
        super("in", name, type, value);
    }

    get location() {
        if (!this.program || !this.gl) return null;
        if (this._location) return this._location;
        this._location = this.gl.getAttribLocation(this.program, this.name);
        return this._location;
    }

    createBuffer() {
        const { gl } = this;
        this.buffer = gl.createBuffer();
    }

    upload() {
        const { gl, settings } = this;
        if (this._value === undefined || !this._location) return;
        // console.log("upload buffer", this._buffer, this._value);
        if (!this.buffer) this.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._value), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this._location, settings.args, gl[settings.argType], false, 0, 0);
        gl.enableVertexAttribArray(this._location);
        checkGLError(this.gl);
    }

    download() {
        const downloaded = new Float32Array(this.length * this.settings.args);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.getBufferSubData(gl.ARRAY_BUFFER, 0, downloaded); // Retrieve updated positions
        this._value = downloaded;
        return downloaded;
    }
}

export default VariableBase;