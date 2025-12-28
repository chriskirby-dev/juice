/**
 * WebGL shader management for vertex, fragment, compute, and geometry shaders.
 * Provides shader compilation, uniform/attribute management, and shader builder integration.
 * @module Graphics/WebGL/Lib/Shader
 */

import { Uniform } from "../Variables/Variables.mjs";
import InputAttribute from "../Variables/InputAttribute.mjs";
import OutputAttribute from "../Variables/OutputAttribute.mjs";
import ShaderBuilder from "./ShaderBuilder.mjs";
import { objectFilter } from "../../../Util/Object.mjs";

const SHADER_TYPES = ["vertex", "fragment", "compute", "geometry"];
//The vertex shader is where the waving effect will be implemented
//The fragment shader will handle texturing and coloring of the flag

import { VariableTypes, StorageQualifier, Variable } from "./Variable.mjs";

export const ShaderTypes = {
    VERTEX: "VERTEX_SHADER",
    FRAGMENT: "FRAGMENT_SHADER",
    has(shaderType) {
        return Object.values(ShaderTypes).includes(shaderType);
    },
};

export class Shader {
    /**
     * @type {WebGLRenderingContext}
     */
    static context = null;

    /**
     * @type {ShaderTypes}
     */
    static ShaderTypes = ShaderTypes;

    /**
     * @type {string[]}
     */
    headers = [];

    /**
     * @type {Object<string, Variable>}
     */
    variables = {};

    /**
     * @type {Object<string, Variable>}
     */
    accessableVars = {};

    variableIndex = [];
    storageBuffers = [];

    setupOperations = [];

    /**
     * @param {ShaderTypes} type
     * @param {Object} options
     * @param {WebGL} [options.webgl]
     * @param {WebGLRenderingContext} [options.gl]
     * @param {number} [options.version=2]
     */
    constructor(type, options = {}) {
        if (!ShaderTypes.has(type)) throw new Error(`Invalid shader type: ${type}`);
        this.type = type;
        if (options.webgl) {
            this.webgl = options.webgl;
            this.gl = options.webgl.gl;
        } else if (options.gl) {
            this.webgl = null;
            this.gl = options.gl;
        }
        this.version = options.version || 2;
        this.builder = new ShaderBuilder(this.version);
        if (this.version < 2) {
            this.setupVersion1();
        } else {
            this.setupVersion2();
        }
    }

    addStructure(name, properties) {
        const props = [];
        for (let prop in properties) {
            props.push(`${properties[prop]} ${prop};`);
        }

        const struct = `struct ${name} {
            ${properties.join("\n")}        
        }`;

        this.builder.addHeader(struct);
    }

    /**
     * @private
     */
    setupVersion1() {
        this.allowedQualifiers = ["attribute", "varying", "uniform"];
    }

    /**
     * @private
     */
    setupVersion2() {
        this.allowedQualifiers = ["in", "out", "inout", "uniform"];
    }

    onProgramLoaded(program) {
        console.log(`Shader.onProgramLoaded called with program ${program}`);
        this.program = program;
        for (const name in this.variables) {
            const variable = this.variables[name];
            console.log(`Shader.onProgramLoaded trying to bind ${name}`);
            if (variable.bind) {
                console.log(`Shader.onProgramLoaded binding ${name}`);
                variable.bind(this.gl, this.program);
            } else {
                console.log(`Shader.onProgramLoaded could not bind or call onProgram on ${name}`);
            }
        }
    }

    addFunction(returnType, name, args, code) {
        this.builder.addFunction(returnType, name, args, code);
    }

    createUniformBuffer(name, properties, allocation = "std430") {
        const { gl } = this;
        let size = 0;
        const props = [];
        for (let prop in properties) {
            props.push(`${properties[prop].type} ${prop}[${properties[prop].size}];`);
            size += properties[prop].size * properties[prop].bytes;
        }

        const buff = `layout(std140) uniform ${name} {
            ${props.join("\n")}
        };`;

        this.headers.push(buff);

        return {
            createBuffer: (properties) => {
                const keys = Object.keys(properties);
                const length = properties[keys[0]].length;
                const data = new Float32Array(length * keys.length);
                let counter = 0;
                for (let i = 0; i < length; i++) {
                    for (let j = 0; j < keys.length; j++) {
                        const row = properties[keys[j]][i];
                        if (Array.isArray(row)) {
                            for (let k = 0; k < row.length; k++) {
                                data[counter] = row[k];
                                counter++;
                            }
                        } else {
                            data[counter] = row;
                            counter++;
                        }
                    }
                }

                const buffer = gl.createBuffer();
                gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);

                gl.bufferData(gl.UNIFORM_BUFFER, size * 2, gl.DYNAMIC_DRAW);
                gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, buffer);
                // Bind the buffer to a binding point
                const blockIndex = gl.getUniformBlockIndex(this.webgl.program, "ParticleProps");
                // Assign the uniform block to binding point 0
                gl.uniformBlockBinding(this.webgl.program, blockIndex, 0);
            },
            upload(bufferdata) {},
        };
    }

    /**
     * @param {string} name
     * @returns {Variable}
     */
    getVariable(name) {
        return this.variables[name];
    }

    /**
     * @param {string} precision
     * @param {string} dataType
     * @returns {Shader}
     */
    setPrecision(precision, dataType) {
        this.builder.setPrecision(precision, dataType);
        return this;
    }

    /**
     * @param {string} name
     * @param {string} type
     * @param {Object} [options]
     * @returns {Shader}
     */
    addAttribute(name, type, options) {
        if (this.version == 2) return this.addVariable(StorageQualifier.IN, name, type, options);
        return this.addVariable(StorageQualifier.ATTRIBUTE, name, type, options);
    }

    /**
     * @param {string} name
     * @param {string} type
     * @param {Object} [options]
     * @returns {Shader}
     */
    addVarying(name, type, options) {
        if (this.version == 2) return this.addVariable(StorageQualifier.OUT, name, type, options);
        return this.addVariable(StorageQualifier.VARYING, name, type, options);
    }

    /**
     * @param {string} name
     * @param {string} type
     * @param {Object} [options]
     * @returns {Shader}
     */
    addUniform(name, type, options) {
        this.variables[name] = new Uniform(name, type, options);
        this.variables[name].define(this.builder);
        this.variableIndex.push(name);
        return this.variables[name];
    }

    /**
     * @param {string} name
     * @param {string} type
     * @param {Object} [options]
     * @returns {Shader}
     */
    addInput(name, type, options) {
        this.variables[name] = new InputAttribute(name, type, options);
        this.variables[name].define(this.builder);
        this.variableIndex.push(name);
        return this.variables[name];
    }

    /**
     * @param {string} name
     * @param {string} type
     * @param {Object} [options]
     * @returns {Shader}
     */
    addOutput(name, type, options) {
        this.variables[name] = new OutputAttribute(name, type, options);
        this.variables[name].define(this.builder);
        this.variableIndex.push(name);
        return this.variables[name];
    }

    /**
     * @param {StorageQualifier} storageQualifier
     * @param {string} name
     * @param {string} type
     * @param {Object} [options]
     * @returns {Shader}
     */
    addVariable(storageQualifier, name, type, options = {}) {
        if (!Variable.qualifiers.includes(storageQualifier)) {
            throw new Error(`Invalid variable class: ${storageQualifier}`);
        }

        if (storageQualifier === Variable.ATTRIBUTE && this.type !== ShaderTypes.VERTEX) {
            throw new Error(`Cannot add attribute variable to fragment shader: ${name}`);
        }

        const variableOptions = { ...options, webgl: this.webgl };
        this.variables[name] = new Variable(storageQualifier, type, name, variableOptions);
        this.variableIndex.push(name);

        return this.variables[name];
    }

    /**
     * @param {string} name
     * @returns {Variable}
     */
    getAccessableVariable(name) {
        return this.accessableVars[name];
    }

    /**
     * @param {string} content
     * @returns {Shader}
     */
    main(content) {
        this.builder.addMain(content);
        return this;
    }

    /**
     * @returns {string}
     */
    generateShader() {
        return this.builder.build();
    }

    head = [];

    addHeadItem(item) {
        if (typeof item == "string") {
            this.head.push(item);
        }
    }

    /**
     * @param {string} [source]
     * @returns {WebGLShader}
     */
    build(source = this.generateShader()) {
        const { type, gl } = this;
        const shader = gl.createShader(gl[type]);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Error compiling shader: ${error}`);
        }
        this.shader = shader;
        return shader;
    }
}

export default Shader;