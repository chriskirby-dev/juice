import VariableBase from "./VariableBase.mjs";
class FeedbackAttribute extends VariableBase {
    constructor(...args) {
        super("in", ...args);
        this.LOCATION_LOOKUP = "getAttribLocation";
        this.children = [];
    }

    define(builder) {
        const { settings, gl } = this;
        builder.define(
            (this._locationId !== null ? `layout(location = ${this._locationId}) ` : "") + "in",
            this.name,
            this.type
        );
        builder.define("out", this.name + "Out", this.type);
    }

    get definition() {
        return (
            (this._locationId !== null ? `layout(location = ${this._locationId}) ` : "") +
            `in ${this.type} ${this.name};
            out ${this.type} ${this.name}Out;
        `
        );
    }

    addChild(attribute) {
        this.children.push(attribute);
    }

    upload() {
        const { settings, gl } = this;
        if (!this.buffer) this.createBuffers();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.write);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._value), gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    download() {
        const { settings, gl } = this;
        const data = new Float32Array(this._value.length);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.read);
        gl.getBufferSubData(gl.ARRAY_BUFFER, 0, data);
        return data;
    }

    attachCaptureBuffer() {
        const { gl, index = 0, name } = this;
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, index, this.buffer.write);
    }

    unbindBuffer() {
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    }

    createBuffers() {
        console.log("CREATE BUFFERS", this.name);
        const { settings, gl } = this;
        this.buffer = {
            read: gl.createBuffer(),
            write: gl.createBuffer(),
        };

        if (!this.buffer.read || !this.buffer.write) {
            throw new Error(`Failed to create buffers for ${this.name}`);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.read);
        if (this._value) {
            gl.bufferData(gl.ARRAY_BUFFER, this._value, gl.DYNAMIC_DRAW);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.write);
        if (this._value) {
            gl.bufferData(gl.ARRAY_BUFFER, this._value, gl.DYNAMIC_DRAW);
        }

        //Clean up
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    swapBuffers() {
        const { settings, gl } = this;
        if (!this.buffer) return;

        const temp = this.buffer.read;
        this.buffer.read = this.buffer.write;
        this.buffer.write = temp;
    }

    onBound() {
        console.log("onBound", this.name);
        if (!this.buffer) {
            this.createBuffers();
        }
    }
}

export default FeedbackAttribute;
