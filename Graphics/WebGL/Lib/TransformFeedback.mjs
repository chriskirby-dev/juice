import { VariableTypes } from "./Variable.mjs";
import Shader from "./Shader.mjs";
import VariableSettings from "../Variables/VariableSettings.mjs";
export const ShaderTypes = Shader.ShaderTypes;
import ShaderBuilder from "./ShaderBuilder.mjs";
import VariableBase from "../Variables/VariableBase.mjs";
import Uniform from "../Variables/Uniform.mjs";
import FeedbackAttribute from "../Variables/FeedbackAttribute.mjs";
import { createProgram, createShader, checkGLError } from "./Helper.mjs";

class TransformFeedback {
    version = 2;
    _buffers = {};
    _variables = {};
    _uniforms = {};

    constructor(points, gl) {
        this.gl = gl;
        this.points = points;
        VariableBase.gl = gl;

        this.initialize();
    }

    buffer(name) {
        return this._variables[name].buffer.read;
    }

    uniform(name) {
        return this._uniforms[name];
    }

    addStruct(name, fields) {
        this.builder.addStruct(name, fields);
    }

    addFunction(returnType, name, args, code) {
        this.builder.addFunction(returnType, name, args, code);
    }

    addUniform(name, type, value) {
        const uniform = new Uniform(name, type, value);
        uniform.define(this.builder);
        this._uniforms[name] = uniform;
        return uniform;
    }

    addVariable(name, type, data = []) {
        this.vIndex++;
        const variable = new FeedbackAttribute(name, type, data);
        variable.index = this.vIndex;
        variable.define(this.builder);
        this._variables[name] = variable;
        return variable;
    }

    var(name) {
        return this._variables[name];
    }

    setScript(script) {
        this.builder.addMain(script);
    }

    build() {
        const { gl } = this;
        console.log("Building transform feedback");
        const vertexShader = this.createShader(gl.VERTEX_SHADER, this.builder.build());
        const fragmentShader = this.createShader(
            gl.FRAGMENT_SHADER,
            `#version 300 es
            precision mediump float;
            out vec4 outColor;
            void main() {
                outColor = vec4(0.0, 0.0, 0.0, 0.0);
            }
        `
        );

        this.varyings = Object.keys(this._variables).map((name) => name + "Out");
        console.log("Varyings", this.varyings);
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.transformFeedbackVaryings(program, this.varyings, gl.SEPARATE_ATTRIBS);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Program linking error: ${gl.getProgramInfoLog(program)}`);
        }

        console.log("Program linked successfully");
        this.program = program;
        gl.useProgram(this.program);

        //this.initVariables(program);
        // this.transformFeedback = gl.createTransformFeedback();
        // gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.transformFeedback);
        //Create Buffers Link Program
        Object.keys(this._uniforms).forEach((name) => this._uniforms[name].bind(gl, program));

        Object.keys(this._variables).forEach((name) => this._variables[name].bind(gl, program));

        Object.keys(this._variables).forEach((name, i) => {
            this._variables[name].bindInputBuffer();
            //this._variables[name].bindOutputBuffer(i);
        });
    }

    createShader(type, source) {
        const { setting, gl } = this;
        console.log(source);
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(`Shader compilation error: ${gl.getShaderInfoLog(shader)}`);
        }

        return shader;
    }

    update(deltaTime) {
        if (!this.program) return;
        const { gl } = this;

        gl.useProgram(this.program);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Set the delta time for updating particles
        // gl.uniform1f(this.deltaTimeLocation, deltaTime);

        Object.keys(this._variables).map((name) => {
            this._variables[name].swapBuffers();
            //this._variables[name].bindOutputBuffer();
        });

        // Enable transform feedback
        gl.enable(gl.RASTERIZER_DISCARD); // Disable rendering to the screen

        // Bind the transform feedback object
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.transformFeedback);

        // Begin transform feedback
        gl.beginTransformFeedback(gl.POINTS);

        // Draw the particles using POINTS
        gl.drawArrays(gl.POINTS, 0, this.points);

        // End transform feedback
        gl.endTransformFeedback();

        // Disable transform feedback and rasterizer discard
        gl.disable(gl.RASTERIZER_DISCARD);

        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

        // Bind input (read) and output (write) buffers
    }

    initialize() {
        const { gl } = this;
        this.builder = new ShaderBuilder(this.version);
        this.webgl = {};

        //this.builder.define("uniform", "float", "uDeltaTime");
    }
}

export default TransformFeedback;
