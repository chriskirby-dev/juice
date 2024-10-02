/**
 * @author Chris Kirby
 * @title Full Stack Developer
 * @company Kirby Creative
 * @date 10/02/2024
 */

const SHADER_TYPES = ["vertex", "fragment"];
//The vertex shader is where the waving effect will be implemented
//The fragment shader will handle texturing and coloring of the flag

import { VariableTypes, StorageQualifier, Variable } from "./Variable.mjs";

export const ShaderTypes = {
    VERTEX: "VERTEX_SHADER",
    FRAGMENT: "FRAGMENT_SHADER",
    has(type) {
        return Object.values(ShaderTypes).includes(type);
    },
};

function compileShader(version, headers, definitions, main) {
    return `${version === 1 ? "#version 100" : "#version 300 es"}
${headers.length ? headers.join("\n") : ""}   

${definitions.join("\n")}

void main() { ${main} }
`;
}

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

        if (this.version < 2) {
            this.setupVersion1();
        } else {
            this.setupVersion2();
        }
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
        this.headers.push(`precision ${precision.toLowerCase()}p ${dataType};`);
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
        return this.addVariable(StorageQualifier.UNIFORM, name, type, options);
    }

    /**
     * @param {string} name
     * @param {string} type
     * @param {Object} [options]
     * @returns {Shader}
     */
    addInput(name, type, options) {
        return this.addVariable(StorageQualifier.IN, name, type, options);
    }

    /**
     * @param {string} name
     * @param {string} type
     * @param {Object} [options]
     * @returns {Shader}
     */
    addOutput(name, type, options) {
        return this.addVariable(StorageQualifier.OUT, name, type, options);
    }

    /**
     * @param {StorageQualifier} storageQualifier
     * @param {string} name
     * @param {string} type
     * @param {Object} [options]
     * @returns {Shader}
     */
    addVariable(storageQualifier, name, type, options = {}) {
        const validStorageQualifiers = Variable.qualifiers;

        if (!validStorageQualifiers.includes(storageQualifier)) {
            throw new Error(`Invalid variable class: ${storageQualifier}`);
        }

        if (storageQualifier === Variable.ATTRIBUTE && this.type !== ShaderTypes.VERTEX) {
            throw new Error(`Cannot add attribute variable to fragment shader: ${name}`);
        }

        const variableOptions = { ...options, webgl: this.webgl };
        this.variables[name] = new Variable(storageQualifier, type, name, variableOptions);
        this.variableIndex.push(name);
        return this;
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
        this._main = content;
        return this;
    }

    /**
     * @returns {string}
     */
    generateShader() {
        const definitions = [];

        const qualifiers = Variable.qualifiers;
        qualifiers.forEach((storageQualifier) => {
            for (let name in this.variables) {
                const v = this.variables[name];
                if (v.qualifier == storageQualifier) {
                    definitions.push(v.declare());
                }
            }
        });

        return compileShader(this.version, this.headers, definitions, this._main);
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
