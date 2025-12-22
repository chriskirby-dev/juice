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
        if (this.debug || (this.parent && this.parent.debug)) {
        }
    }

    unbindBuffer() {
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    }

    createBuffers() {
        console.log("CREATE BUFFERS", this.name);
        const { settings, gl } = this;
        this.buffer = {
            read: gl.createBuffer(),
            write: gl.createBuffer()
        };

        if (!this.buffer.read || !this.buffer.write) {
            throw new Error(`Failed to create buffers for ${this.name}`);
        }

        // Determine element/component count and desired item count
        const components = settings && settings.args ? settings.args : 1;
        const itemCount = this.points || (this._value ? this._value.length / components : 0);

        // Normalize value into a Float32Array and ensure proper length
        let data = null;
        if (this._value) {
            data = this._value instanceof Float32Array ? this._value : new Float32Array(this._value);
        } else if (itemCount > 0) {
            data = new Float32Array(itemCount * components);
        } else {
            // fallback: allocate at least one element per component
            data = new Float32Array(components);
        }

        // Keep normalized _value for future uploads
        this._value = data;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.read);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.write);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

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

    resizeBuffers(newItemCount) {
        const { settings, gl } = this;
        if (!this.buffer) {
            console.warn(`${this.name}: resizeBuffers called before createBuffers`);
            return;
        }

        const components = settings && settings.args ? settings.args : 1;
        const newSize = newItemCount * components;

        // Create new data array sized to new count
        const newData = new Float32Array(newSize);

        // Copy existing data if present
        if (this._value && this._value.length > 0) {
            const copyCount = Math.min(this._value.length, newSize);
            newData.set(this._value.subarray(0, copyCount));
        }

        // Update the stored value
        this._value = newData;

        // Reallocate GPU buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.read);
        gl.bufferData(gl.ARRAY_BUFFER, newData, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.write);
        gl.bufferData(gl.ARRAY_BUFFER, newData, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}

export default FeedbackAttribute;
