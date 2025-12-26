export const VariableSettings = {
    float: {
        setFn: "uniform1f",
        args: 1,
        type: "float",
        argType: "FLOAT"
    },
    vec2: {
        setFn: "uniform2fv",
        args: 2,
        type: ["float", "float"],
        argType: "FLOAT"
    },
    vec3: {
        setFn: "uniform3fv",
        args: 3,
        type: ["float", "float", "float"],
        argType: "FLOAT"
    },
    vec4: {
        setFn: "uniform4fv",
        args: 4,
        type: ["float", "float", "float", "float"],
        argType: "FLOAT"
    },
    mat2: {
        setFn: "uniformMatrix2fv",
        args: 1,
        type: "float[]",
        argType: "FLOAT"
    },
    mat3: {
        setFn: "uniformMatrix3fv",
        args: 1,
        type: "float[]",
        argType: "FLOAT"
    },
    mat4: {
        setFn: "uniformMatrix4fv",
        generate: (matrix) => {
            return [false, matrix];
        },
        args: 1,
        type: "float[]",
        argType: "FLOAT"
    },
    int: {
        setFn: "uniform1i",
        args: 1,
        type: "int",
        argType: "INT"
    },
    ivec2: {
        setFn: "uniform2i",
        args: 2,
        type: ["int", "int"],
        argType: "INT"
    },
    ivec3: {
        setFn: "uniform3i",
        args: 3,
        type: ["int", "int", "int"],
        argType: "INT"
    },
    ivec4: {
        setFn: "uniform4i",
        args: 4,
        type: ["int", "int", "int", "int"],
        argType: "INT"
    },
    sampler2D: {
        setFn: "uniform1i",
        args: 1,
        type: "int",
        argType: "INT"
    },
    samplerCube: {
        setFn: "uniform1i",
        args: 1,
        type: "int",
        argType: "INT"
    },
    uint: {
        setFn: "uniform1ui",
        args: 1,
        type: "uint",
        argType: "UNSIGNED_INT"
    },
    uvec2: {
        setFn: "uniform2ui",
        args: 2,
        type: ["uint", "uint"],
        argType: "UNSIGNED_INT"
    },
    uvec3: {
        setFn: "uniform3ui",
        args: 3,
        type: ["uint", "uint", "uint"],
        argType: "UNSIGNED_INT"
    },
    uvec4: {
        setFn: "uniform4ui",
        args: 4,
        type: ["uint", "uint", "uint", "uint"],
        argType: "UNSIGNED_INT"
    },
    bool: {
        setFn: "uniform1i",
        args: 1,
        type: "int",
        argType: "INT"
    },
    bvec2: {
        setFn: "uniform2i",
        args: 2,
        type: ["int", "int"],
        argType: "INT"
    },
    bvec3: {
        setFn: "uniform3i",
        args: 3,
        type: ["int", "int", "int"],
        argType: "INT"
    },
    bvec4: {
        setFn: "uniform4i",
        args: 4,
        type: ["int", "int", "int", "int"],
        argType: "INT"
    }
};

export default VariableSettings;