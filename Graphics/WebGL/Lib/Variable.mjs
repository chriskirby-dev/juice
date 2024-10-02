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

export const VariableSettings = {
    float: {
        setFn: "uniform1f",
        args: 1,
        type: "float",
        argType: "FLOAT",
    },
    vec2: {
        setFn: "uniform2f",
        args: 2,
        type: ["float", "float"],
        argType: "FLOAT",
    },
    vec3: {
        setFn: "uniform3f",
        args: 3,
        type: ["float", "float", "float"],
        argType: "FLOAT",
    },
    vec4: {
        setFn: "uniform4f",
        args: 4,
        type: ["float", "float", "float", "float"],
        argType: "FLOAT",
    },
    mat2: {
        setFn: "uniformMatrix2fv",
        args: 1,
        type: "float[]",
        argType: "FLOAT",
    },
    mat3: {
        setFn: "uniformMatrix3fv",
        args: 1,
        type: "float[]",
        argType: "FLOAT",
    },
    mat4: {
        setFn: "uniformMatrix4fv",
        args: 1,
        type: "float[]",
        argType: "FLOAT",
    },
    int: {
        setFn: "uniform1i",
        args: 1,
        type: "int",
        argType: "INT",
    },
    ivec2: {
        setFn: "uniform2i",
        args: 2,
        type: ["int", "int"],
        argType: "INT",
    },
    ivec3: {
        setFn: "uniform3i",
        args: 3,
        type: ["int", "int", "int"],
        argType: "INT",
    },
    ivec4: {
        setFn: "uniform4i",
        args: 4,
        type: ["int", "int", "int", "int"],
        argType: "INT",
    },
    sampler2D: {
        setFn: "uniform1i",
        args: 1,
        type: "int",
        argType: "INT",
    },
    samplerCube: {
        setFn: "uniform1i",
        args: 1,
        type: "int",
        argType: "INT",
    },
    uint: {
        setFn: "uniform1ui",
        args: 1,
        type: "uint",
        argType: "UNSIGNED_INT",
    },
    uvec2: {
        setFn: "uniform2ui",
        args: 2,
        type: ["uint", "uint"],
        argType: "UNSIGNED_INT",
    },
    uvec3: {
        setFn: "uniform3ui",
        args: 3,
        type: ["uint", "uint", "uint"],
        argType: "UNSIGNED_INT",
    },
    uvec4: {
        setFn: "uniform4ui",
        args: 4,
        type: ["uint", "uint", "uint", "uint"],
        argType: "UNSIGNED_INT",
    },
    bool: {
        setFn: "uniform1i",
        args: 1,
        type: "int",
        argType: "INT",
    },
    bvec2: {
        setFn: "uniform2i",
        args: 2,
        type: ["int", "int"],
        argType: "INT",
    },
    bvec3: {
        setFn: "uniform3i",
        args: 3,
        type: ["int", "int", "int"],
        argType: "INT",
    },
    bvec4: {
        setFn: "uniform4i",
        args: 4,
        type: ["int", "int", "int", "int"],
        argType: "INT",
    },
};

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

    static qualifiers = ["const", "attribute", "uniform", "varying", "in", "out", "inout"];

    _location;
    buffer;

    setter = null;

    constructor(qualifier, type, name, options = {}) {
        this.qualifier = qualifier;
        this.type = type;
        this.name = name;
        this.options = options;

        if (options.webgl) {
            this.webgl = options.webgl;
            this.gl = this.webgl.gl;
        }

        if (VariableSettings[this.type]) {
            this.settings = VariableSettings[this.type];
        }
    }

    declare() {
        return `${this.qualifier} ${this.type} ${this.name};`;
    }

    get location() {
        if (!this.program) this.program = this.webgl.program;
        if (this._location) return this._location;
        const { gl } = this;
        switch (this.qualifier) {
            case StorageQualifier.ATTRIBUTE:
            case StorageQualifier.IN:
                this._location = gl.getAttribLocation(this.program, this.name);
                return this._location;
                break;
            case StorageQualifier.UNIFORM:
                this._location = gl.getUniformLocation(this.program, this.name);
                return this._location;
                break;
            case StorageQualifier.VARYING:
                this._location = gl.getUniformLocation(this.program, this.name);
                return this._location;
                break;
        }
        this._location = gl.getAttribLocation(this.program, this.name);
    }

    set(data) {
        const { gl } = this;
        this.value = data;
        if (this.setter) {
            gl[this.setter](this.program, this.location, data);
        }
    }

    createBuffer(value) {
        if (value) this.value = value;
        if (this.buffer) return this.buffer;
        const { gl } = this;

        const assignments = ["UNSIGNED_BYTE", "SHORT", "UNSIGNED_SHORT", "INT", "UNSIGNED_INT", "FLOAT"];

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        if (this.value) gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.value), gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.location, 2, gl[this.settings.argType], false, 0, 0);
        gl.enableVertexAttribArray(this.location);
        this.buffer = buffer;
        return this.buffer;
    }
}

export default {};
