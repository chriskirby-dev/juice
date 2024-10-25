import VariableBase from "./VariableBase.mjs";
class FeedbackAttribute extends VariableBase {
    constructor(...args) {
        super("in", ...args);
    }

    define(builder) {
        const { settings, gl } = this;
        builder.define(
            (this.location !== undefined ? `layout(location = ${this.location}) ` : "") + "in",
            this.name,
            this.type
        );
        builder.define("out", this.name + "Out", this.type);
    }

    get definition() {
        return (
            (this.location !== undefined ? `layout(location = ${this.location}) ` : "") +
            `in ${this.type} ${this.name};
            out ${this.type} ${this.name}Out;
        `
        );
    }

    lookupLocation() {
        if (!this.bound) return;
        const { gl } = this;
        this.location = gl.getAttribLocation(this.program, this.name);
        return this.location;
    }

    upload() {
        const { settings, gl } = this;
        if (!this.buffer) this.createBuffers();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.input);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._value), gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    download() {
        const { settings, gl } = this;
        const data = new Float32Array(this._value.length);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.input);
        gl.getBufferSubData(gl.ARRAY_BUFFER, 0, data);
        return data;
    }

    unbindOutputBuffer() {
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    }

    bindOutputBuffer() {
        const { gl, index = 0, name } = this;
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, index, this.buffer.output);
    }

    bindInputBuffer() {
        const { settings, gl } = this;
        if (!this.buffer) this.createBuffers();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.input);
        gl.enableVertexAttribArray(this.location);
        gl.vertexAttribPointer(this.location, 3, gl.FLOAT, false, 0, 0);
    }

    bindBuffers() {
        if (!this.buffer) this.createBuffers();
        this.bindInputBuffer();
        this.bindOutputBuffer();
    }

    createBuffers() {
        const { settings, gl } = this;
        this.buffer = {
            input: gl.createBuffer(),
            output: gl.createBuffer(),
        };

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.input);
        if (this._value) {
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._value.length), gl.DYNAMIC_DRAW);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.output);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._value), gl.DYNAMIC_DRAW);

        //Clean up
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    swapBuffers() {
        const { settings, gl } = this;
        if (!this.buffer) return;

        const temp = this.buffer.input;
        this.buffer.input = this.buffer.output;
        this.buffer.output = temp;

        this.bindInputBuffer();
        this.bindOutputBuffer();
    }

    onBound() {
        if (!this.buffer) {
            this.createBuffers();
        }
    }
}

export default FeedbackAttribute;
