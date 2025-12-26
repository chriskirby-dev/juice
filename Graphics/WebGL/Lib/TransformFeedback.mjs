import { VariableTypes } from "./Variable.mjs";
import Shader from "./Shader.mjs";
import VariableSettings from "../Variables/VariableSettings.mjs";
export const ShaderTypes = Shader.ShaderTypes;
import ShaderBuilder from "./ShaderBuilder.mjs";
import VariableBase from "../Variables/VariableBase.mjs";
import { Uniform } from "../Variables/Variables.mjs";
import FeedbackAttribute from "../Variables/FeedbackAttribute.mjs";
import { createProgram, createShader } from "./Helper.mjs";

class TransformFeedback {
    version = 2;
    _buffers = {};
    _variables = {};
    _uniforms = {};

    constructor(points, gl) {
        this.gl = gl;
        this.points = points;
        VariableBase.gl = gl;

        this.debug = false; // set true for verbose TF build diagnostics

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
        // make the variable aware of the TF particle count so it can size buffers
        variable.points = this.points;
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
                gl.bindBuffer(gl.ARRAY_BUFFER, feedbackVar.buffer.write);
                if (!(location === null || location === undefined || location === -1)) {
                    gl.vertexAttribPointer(location, settings.args, gl[settings.argType], false, 0, 0);
                    gl.enableVertexAttribArray(location);
                }
            }
        });
    }

    build() {
        const { gl } = this;
        const vertexSource = this.builder.build();
        if (this.debug) {
            try {
                console.log("[TF DEBUG] Vertex shader (pre-compile):\n", vertexSource);
            } catch (e) {
                /* ignore logging errors */
            }
        }
        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);

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

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.transformFeedbackVaryings(program, this.varyings, gl.SEPARATE_ATTRIBS);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program);
            console.error("Program linking error:", error);
            gl.deleteProgram(program);
            throw new Error(`Program linking error: ${error}`);
        }
        this.program = program;
        gl.useProgram(this.program);

        // Debug: optionally print the built vertex shader source, varyings, and variable locations
        if (this.debug) {
            try {
                console.log("[TF DEBUG] Vertex Shader Source:\n", vertexSource);
                console.log("[TF DEBUG] Varyings:", this.varyings);
                Object.keys(this._variables).forEach((name) => {
                    const v = this._variables[name];
                    const bufInfo = v.buffer
                        ? {
                              hasRead: !!v.buffer.read,
                              hasWrite: !!v.buffer.write,
                              valueLen: v._value ? v._value.length || v._value.byteLength || null : null
                          }
                        : null;
                    console.log(`[TF DEBUG] variable=${name}`, { location: v.location, buffer: bufInfo });
                    if (v.children && v.children.length) {
                        v.children.forEach((c) => console.log(`[TF DEBUG]  child=${c.name}`, { location: c.location }));
                    }
                });
            } catch (e) {
                console.warn("[TF DEBUG] Failed to print diagnostics:", e.message);
            }
        }

        this.vao = { read: gl.createVertexArray(), write: gl.createVertexArray() };

        // Bind uniforms
        Object.keys(this._uniforms).forEach((name) => this._uniforms[name].bind(gl, program));

        // Bind Feedback variables
        Object.keys(this._variables).forEach((name) => this._variables[name].bind(gl, program));

        // Bind VAO
        gl.bindVertexArray(this.vao.read);
        //Bind Read Attributes to VAO
        Object.keys(this._variables).forEach((name, i) => {
            const variable = this._variables[name];
            const settings = variable.settings;
            gl.bindBuffer(gl.ARRAY_BUFFER, variable.buffer.read);
            if (!(variable.location === null || variable.location === undefined || variable.location === -1)) {
                gl.enableVertexAttribArray(variable.location);
                gl.vertexAttribPointer(variable.location, settings.args, gl[settings.argType], false, 0, 0);
            }
        });
        // Ensure ARRAY_BUFFER isn't left bound to a capture buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(this.vao.write);
        //Bind Write Attributes to VAO
        Object.keys(this._variables).forEach((name, i) => {
            const variable = this._variables[name];
            const settings = variable.settings;
            gl.bindBuffer(gl.ARRAY_BUFFER, variable.buffer.write);
            if (!(variable.location === null || variable.location === undefined || variable.location === -1)) {
                gl.enableVertexAttribArray(variable.location);
                gl.vertexAttribPointer(variable.location, settings.args, gl[settings.argType], false, 0, 0);
            }
        });

        // Ensure ARRAY_BUFFER isn't left bound to a capture buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.transformFeedback = gl.createTransformFeedback();
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
        // Debug: check for GL errors before begin
        if (this.debug) {
            let e;
            while ((e = gl.getError()) !== gl.NO_ERROR) console.warn("[TF DEBUG] pre-begin glError:", e);
        }
        gl.beginTransformFeedback(gl.POINTS);

        // Draw the particles using POINTS
        gl.drawArrays(gl.POINTS, 0, this.points);

        // End transform feedback
        gl.endTransformFeedback();
        if (this.debug) {
            let e;
            while ((e = gl.getError()) !== gl.NO_ERROR) console.warn("[TF DEBUG] post-end glError:", e);
        }

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