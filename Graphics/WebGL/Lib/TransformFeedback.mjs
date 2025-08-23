import { VariableTypes } from "./Variable.mjs";
import Shader from "./Shader.mjs";
import VariableSettings from "../Variables/VariableSettings.mjs";
export const ShaderTypes = Shader.ShaderTypes;
import ShaderBuilder from "./ShaderBuilder.mjs";
import VariableBase from "../Variables/VariableBase.mjs";
import { Uniform } from "../Variables/Variables.mjs";
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

    addStruct(...args) {
        this.builder.addStruct(...args);
    }

    addFunction(...args) {
        this.builder.addFunction(...args);
    }

    addUniform(name, type, value, ...rest) {
        const uniform = new Uniform(name, type, value, ...rest);
        uniform.define(this.builder);
        this._uniforms[name] = uniform;
        return uniform;
    }

    addVariable(name, type, data = [], ...rest) {
        this.vIndex++;
        const variable = new FeedbackAttribute(name, type, data, ...rest);
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

    applyDownStreamData() {
        Object.keys(this._variables).forEach((name) => {
            const feedbackVar = this._variables[name];
            const { gl, program, settings } = feedbackVar;
            if (feedbackVar.children.length > 0) {
                gl.useProgram(program);
                const location = feedbackVar.children[0].location;
                console.log("Applying down stream data", name, "SIZE", settings.args, location, settings.argType);
                console.log(feedbackVar.download());
                gl.bindBuffer(gl.ARRAY_BUFFER, feedbackVar.buffer.write);
                gl.vertexAttribPointer(location, settings.args, gl[settings.argType], false, 0, 0);
                gl.enableVertexAttribArray(location); // Enable the attribute
            }
        });
    }

    build() {
        const { gl } = this;
        console.log("BUILDING TRANSFORM FEEDBACK");

        const vertexShader = this.createShader(gl.VERTEX_SHADER, this.builder.build());
        console.log("Vertex shader created");

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
        console.log("Fragment shader created");

        this.varyings = Object.keys(this._variables).map((name) => name + "Out");
        console.log("Varyings defined:", this.varyings);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        console.log("Vertex shader attached to program");

        gl.attachShader(program, fragmentShader);
        console.log("Fragment shader attached to program");

        gl.transformFeedbackVaryings(program, this.varyings, gl.SEPARATE_ATTRIBS);
        console.log("Transform feedback varyings set");

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program);
            console.error("Program linking error:", error);
            gl.deleteProgram(program);
            throw new Error(`Program linking error: ${error}`);
        }
        console.log("Program linked successfully");

        this.program = program;
        gl.useProgram(this.program);
        console.log("Program used");

        this.vao = {
            read: gl.createVertexArray(),
            write: gl.createVertexArray(),
        };

        // Bind uniforms
        Object.keys(this._uniforms).forEach((name) => {
            this._uniforms[name].bind(gl, program);
        });

        // Bind Feedback variables
        Object.keys(this._variables).forEach((name) => {
            console.log(`Binding variable ${name} ${this._variables[name].qualifier}`);
            this._variables[name].bind(gl, program);
        });

        // Bind VAO
        gl.bindVertexArray(this.vao.read);
        //Bind Read Attributes to VAO
        Object.keys(this._variables).forEach((name, i) => {
            const variable = this._variables[name];
            const settings = variable.settings;
            gl.bindBuffer(gl.ARRAY_BUFFER, variable.buffer.read);
            gl.enableVertexAttribArray(variable.location);
            gl.vertexAttribPointer(variable.location, settings.args, gl[settings.argType], false, 0, 0);
        });

        gl.bindVertexArray(this.vao.write);
        //Bind Write Attributes to VAO
        Object.keys(this._variables).forEach((name, i) => {
            const variable = this._variables[name];
            const settings = variable.settings;
            gl.bindBuffer(gl.ARRAY_BUFFER, variable.buffer.write);
            gl.enableVertexAttribArray(variable.location);
            gl.vertexAttribPointer(variable.location, settings.args, gl[settings.argType], false, 0, 0);
        });

        this.transformFeedback = gl.createTransformFeedback();

        const log = gl.getProgramInfoLog(program);
        console.log(log);
    }

    createShader(type, source) {
        const { setting, gl } = this;
        // console.log(source);
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

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.program);

        // Discard Screen Rendering
        gl.enable(gl.RASTERIZER_DISCARD);

        gl.bindVertexArray(this.vao.read);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.transformFeedback);

        Object.keys(this._variables).map((name) => {
            this._variables[name].attachCaptureBuffer();
        });

        // Begin transform feedback
        gl.beginTransformFeedback(gl.POINTS);

        // Draw the particles using POINTS
        gl.drawArrays(gl.POINTS, 0, this.points);

        // End transform feedback
        gl.endTransformFeedback();

        // Disable transform feedback and rasterizer discard
        gl.disable(gl.RASTERIZER_DISCARD);

        Object.keys(this._variables).map((name) => {
            this._variables[name].swapBuffers();
        });

        this.vao.tmp = this.vao.read;
        this.vao.read = this.vao.write;
        this.vao.write = this.vao.tmp;
        delete this.vao.tmp;
        // Bind input (read) and output (write) buffers
    }

    initialize() {
        const { gl } = this;
        this.builder = new ShaderBuilder(this.version);
        this.webgl = {};

        const maxVaryings = gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS);
        this.MAX_VARYINGS = maxVaryings;
        //this.builder.define("uniform", "float", "uDeltaTime");
    }
}

export default TransformFeedback;
