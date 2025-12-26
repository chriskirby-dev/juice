import { checkGLError } from "./Helper.mjs";
import VariableSettings from "../Variables/VariableSettings.mjs";
/**
 * 
Variable Type	Purpose	            Stage(s) Used	                    Data Scope	Data Changes	Example
attribute	    Per-vertex data	    Vertex Shader only	                Individual vertices	Changes per vertex	Vertex position, normals
uniform	        Global constant	    Both Vertex and Fragment Shaders	Constant across a draw call	Doesn't change during a draw call	Transformation matrices, light position
varying	        Interpolated data	From Vertex to Fragment Shader	    Interpolated per fragment	Interpolates between vertices	Texture coordinates, colors

Summary:
attribute: Used to supply per-vertex data to the vertex shader. Attributes vary from vertex to vertex and are used to handle data specific to each vertex, like position or texture coordinates.

uniform: Holds constant data (per draw call) that is available to both the vertex and fragment shaders. Uniforms are useful for data that remains the same across all vertices and fragments, such as matrices or global lighting settings.
Examples of uniform variables include transformation matrices, lighting parameters, or texture samplers.


varying: Used to pass interpolated data from the vertex shader to the fragment shader. These values are calculated per vertex, but interpolated across the surface of primitives and used to shade individual pixels.
 */

export const StorageQualifier = {
    ATTRIBUTE: "attribute",
    UNIFORM: "uniform",
    VARYING: "varying",
    IN: "in",
    OUT: "out",
    INOUT: "inout",
    CONST: "const",
    SHARED: "shared",
};

/**
 * These are used to define inputs and outputs between different shader stages.

Vertex Shader:
in: Specifies input attributes from the CPU to the vertex shader.
out: Passes interpolated data from the vertex shader to the fragment shader.
Fragment Shader:
in: Specifies inputs (interpolated data) from the vertex shader.
out: Specifies output data (usually a color value) from the fragment shader to the framebuffer.


*/

/*
gl.uniform1f (floatUniformLoc, v);                 // for float
gl.uniform1fv(floatUniformLoc, [v]);               // for float or float array
gl.uniform2f (vec2UniformLoc,  v0, v1);            // for vec2
gl.uniform2fv(vec2UniformLoc,  [v0, v1]);          // for vec2 or vec2 array
gl.uniform3f (vec3UniformLoc,  v0, v1, v2);        // for vec3
gl.uniform3fv(vec3UniformLoc,  [v0, v1, v2]);      // for vec3 or vec3 array
gl.uniform4f (vec4UniformLoc,  v0, v1, v2, v4);    // for vec4
gl.uniform4fv(vec4UniformLoc,  [v0, v1, v2, v4]);  // for vec4 or vec4 array
 
gl.uniformMatrix2fv(mat2UniformLoc, false, [  4x element array ])  // for mat2 or mat2 array
gl.uniformMatrix3fv(mat3UniformLoc, false, [  9x element array ])  // for mat3 or mat3 array
gl.uniformMatrix4fv(mat4UniformLoc, false, [ 16x element array ])  // for mat4 or mat4 array
 
gl.uniform1i (intUniformLoc,   v);                 // for int
gl.uniform1iv(intUniformLoc, [v]);                 // for int or int array
gl.uniform2i (ivec2UniformLoc, v0, v1);            // for ivec2
gl.uniform2iv(ivec2UniformLoc, [v0, v1]);          // for ivec2 or ivec2 array
gl.uniform3i (ivec3UniformLoc, v0, v1, v2);        // for ivec3
gl.uniform3iv(ivec3UniformLoc, [v0, v1, v2]);      // for ivec3 or ivec3 array
gl.uniform4i (ivec4UniformLoc, v0, v1, v2, v4);    // for ivec4
gl.uniform4iv(ivec4UniformLoc, [v0, v1, v2, v4]);  // for ivec4 or ivec4 array
 
gl.uniform1u (intUniformLoc,   v);                 // for uint
gl.uniform1uv(intUniformLoc, [v]);                 // for uint or uint array
gl.uniform2u (ivec2UniformLoc, v0, v1);            // for uvec2
gl.uniform2uv(ivec2UniformLoc, [v0, v1]);          // for uvec2 or uvec2 array
gl.uniform3u (ivec3UniformLoc, v0, v1, v2);        // for uvec3
gl.uniform3uv(ivec3UniformLoc, [v0, v1, v2]);      // for uvec3 or uvec3 array
gl.uniform4u (ivec4UniformLoc, v0, v1, v2, v4);    // for uvec4
gl.uniform4uv(ivec4UniformLoc, [v0, v1, v2, v4]);  // for uvec4 or uvec4 array
 
// for sampler2D, sampler3D, samplerCube, samplerCubeShadow, sampler2DShadow,
// sampler2DArray, sampler2DArrayShadow
gl.uniform1i (samplerUniformLoc,   v);
gl.uniform1iv(samplerUniformLoc, [v]);
*/

export const VariableTypes = {
    FLOAT: "float",
    FLOAT_VEC2: "vec2",
    FLOAT_VEC3: "vec3",
    FLOAT_VEC4: "vec4",
    INT: "int",
    INT_VEC2: "ivec2",
    INT_VEC3: "ivec3",
    INT_VEC4: "ivec4",
    UNSIGNED_INT: "uint",
    UNSIGNED_INT_VEC2: "uvec2",
    UNSIGNED_INT_VEC3: "uvec3",
    UNSIGNED_INT_VEC4: "uvec4",
    BOOL: "bool",
    BOOL_VEC2: "bvec2",
    BOOL_VEC3: "bvec3",
    BOOL_VEC4: "bvec4",
    FLOAT_MAT2: "mat2",
    FLOAT_MAT3: "mat3",
    FLOAT_MAT4: "mat4",
    SAMPLER_2D: "sampler2D",
    MEDIUMP_FLOAT: "mediump",
};

export class Variable {
    static ATTRIBUTE = "attribute";
    static UNIFORM = "uniform";
    static VARYING = "varying";
    static IN = "in";
    static OUT = "out";
    static INOUT = "inout";

    static qualifiers = Object.values(StorageQualifier);

    _location;
    _feedbackLocation;
    _buffer;
    _feedbackBuffer;

    settings = null;

    constructor(qualifier, type, name, options = {}) {
        this.qualifier = qualifier;
        this.type = type;
        this.name = name;
        this.options = options;

        if (options.webgl) {
            this.webgl = options.webgl;
            this.gl = this.webgl.gl;
        }

        if (options.value) {
            this._value = options.value;
        }

        if (VariableSettings[this.type]) {
            this.settings = VariableSettings[this.type];
        }

        if (this.options.feedback) {
            this.isFeedback = true;
        }

        console.log("CREATING VARIABLE", qualifier, type, name);
    }

    bind(gl, program) {
        this.gl = gl;
        this.program = program;
        console.log("On Program", this.name, this._value);
        if (this._value !== undefined) {
            const v = this._value;
            this._value = null;
            this.value = v;
        }
    }

    declare() {
        let loc = "";
        if (this.options.location !== undefined) {
            loc = `layout(location = ${this.options.location}) `;
            this._location = this.options.location;
        }
        return `${loc}${this.qualifier} ${this.type} ${this.name};`;
    }

    feedbackLocation() {
        if (this._feedbackLocation) return this._feedbackLocation;
        const { gl } = this;
    }

    get location() {
        if (!this.program) this.program = this.webgl.program;
        if (this._location !== undefined) return this._location;
        const { gl } = this;
        switch (this.qualifier) {
            case Variable.UNIFORM:
                this._location = gl.getUniformLocation(this.program, this.name);

                break;
            case Variable.VARYING:
                this._location = gl.getUniformLocation(this.program, this.name);
                break;
            default:
                this._location = gl.getAttribLocation(this.program, this.name);
        }
        /// console.log(this.name, this._location);
        return this._location;
    }

    set(data) {
        const { gl } = this;
        this.value = data;

        if (this.setter) {
            gl[this.setter](this.program, this.location, data);
        }
    }

    set value(value) {
        if (value === this._value) return;
        this._value = value;
        this.upload();
    }

    set deferredValue(value) {
        this._value = value;
    }

    upload() {
        if (this.qualifier === Variable.UNIFORM) {
            if (this.settings) {
                let v = this._value;
                if (this.settings.generate) {
                    v = this.settings.generate(this._value);
                }
                // console.log(this.name, this.settings.setFn, this._value);
                this.gl[this.settings.setFn](this.location, ...(Array.isArray(v) ? v : [v]));
            }
        } else if (this.qualifier === Variable.IN) {
            this.uploadBuffer();
        }
        checkGLError(this.gl);
    }

    get value() {
        return this._value;
    }

    get buffer() {
        if (this._buffer) {
            return this._buffer;
        } else {
            this._buffer = this.createBuffer();
            return this._buffer;
        }
    }

    uploadBuffer() {
        const { gl } = this;
        if (this._value === undefined || !this.location) return;
        // console.log("upload buffer", this._buffer, this._value);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._value), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.location, this.bufferSize, gl[this.settings.argType], false, 0, 0);
        gl.enableVertexAttribArray(this.location);
    }

    swapBuffer(buffer) {
        this._buffer = buffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        this._location = null;
        gl.enableVertexAttribArray(this.location);
        gl.vertexAttribPointer(this.location, gl[this.settings.args], gl[this.settings.argType], false, 0, 0);
    }

    createBuffer(value, size) {
        console.log(this.name, value, size);
        if (value) this._value = value;
        if (this._buffer) return this._buffer;
        const { gl } = this;

        this.bufferSize = size || this.settings.args;

        const assignments = ["UNSIGNED_BYTE", "SHORT", "UNSIGNED_SHORT", "INT", "UNSIGNED_INT", "FLOAT"];
        console.log(this.name, "Buffer Size", this.bufferSize, this.location);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        if (this._value) gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._value), gl.DYNAMIC_DRAW);

        gl.enableVertexAttribArray(this.location);
        gl.vertexAttribPointer(this.location, this.settings.args, gl[this.settings.argType], false, 0, 0);

        if (this.isFeedback) {
            this._feedbackBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this._feedbackBuffer);
            if (this._value) gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._value), gl.STATIC_DRAW);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, this._feedbackBuffer);
        }

        this._buffer = buffer;
        return this._buffer;

        /*

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.positionAttrib, size, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.positionAttrib);

        */
    }
}
export default Variable;