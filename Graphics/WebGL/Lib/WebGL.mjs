import EventEmitter from "../../../Event/Emitter.mjs";
import { Shaders } from "./Shaders.mjs";
import { ShaderTypes } from "./Shader.mjs";
import Texture from "./Texture.mjs";
import Program from "./Program.mjs";
import { VariableTypes, Variable } from "./Variable.mjs";
import TransformFeedback from "./TransformFeedback.mjs";

const PIXEL_STORE_METHODS = {
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: true,
    UNPACK_COLORSPACE_CONVERSION_WEBGL: true,
};

class WebGL extends EventEmitter {
    static Shaders = Shaders;
    static VariableTypes = VariableTypes;
    static Variable = Variable;
    static ShaderTypes = ShaderTypes;

    variables = {};

    textures = [];
    PIXEL_STORE_METHOD = "UNPACK_COLORSPACE_CONVERSION_WEBGL";

    preSetup = [];
    postSetup = [];
    renderSetup = [];

    constructor(parent, width = null, height = null, options = {}) {
        super();
        if (parent instanceof HTMLCanvasElement) {
            this.canvas = parent;
            parent = this.canvas.parentNode;
        }

        this.parent = parent;
        this.width = width;
        this.height = height;
        this.options = options;

        this.PIXEL_STORE_METHOD = options.pixelStore || this.PIXEL_STORE_METHOD;
        this.version = options.version || 2;

        this.initialize();
    }

    addPreSetupOperation(op, ...args) {
        this.preSetup.push([op, args]);
    }

    addPostSetupOperation(op, ...args) {
        this.postSetup.push([op, args]);
    }

    addRenderOperation(op, ...args) {
        this.renderSetup.push([op, args]);
    }

    runOperations(type) {
        this[type + "Setup"].forEach(([op, args = []]) => {
            op(this.gl, ...args);
        });
    }

    createTexture(image) {
        const texture = new Texture(image, this.gl);
        this.textures.push(texture);
        return texture;
    }

    normalize(x, y, z, w) {
        const aspect = this.canvas.width / this.canvas.height;
        const normal = [];

        // Normalize x to range [-1, 1], considering aspect ratio
        normal[0] = -1 + (x / this.canvas.width) * 2 * aspect; // Adjust for aspect ratio

        // Normalize y to range [-1, 1]
        if (y !== undefined) normal[1] = 1 - (y / this.canvas.height) * 2; // Invert Y

        // Include z and w if provided
        if (z !== undefined) normal[2] = z; // Z coordinate remains unchanged
        if (w !== undefined) normal[3] = w; // W coordinate remains unchanged

        return normal;
    }

    transformFeedback() {
        const { gl } = this;
        return new TransformFeedback();
    }

    build() {
        const { shaders, gl } = this;
        const { vertex, fragment } = shaders.build();

        if (this.preSetup.length > 0) {
            this.preSetup.forEach(([op, args = []]) => {
                op(gl, ...args);
            });
        }

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertex);
        gl.attachShader(this.program, fragment);
        gl.linkProgram(this.program);

        this.emit("program", this.program, gl);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.log(gl.getProgramInfoLog(this.program));
            gl.deleteProgram(this.program);
        } else {
            gl.useProgram(this.program);
            shaders.onProgram(this.program);
            if (this.postSetup.length > 0) {
                this.postSetup.forEach(([op, args = []]) => {
                    op(gl, ...args);
                });
            }
        }

        return this.program;
    }

    initialize() {
        if (!this.canvas) {
            this.canvas = document.createElement("canvas");
        }
        this.canvas.width = this.width || this.parent.offsetWidth;
        this.canvas.height = this.height || this.parent.offsetHeight;
        if (this.canvas.parentNode !== this.parent) {
            this.parent.appendChild(this.canvas);
        }
        const contextType = this.version === 2 ? "webgl2" : "webgl";
        const gl = this.canvas.getContext(contextType, {
            alpha: true,
            /*premultipliedAlpha: true,*/
        });
        if (!gl) {
            throw new Error(`WebGL${this.version} not supported`);
        }
        gl.pixelStorei(gl[this.PIXEL_STORE_METHOD], gl.BROWSER_DEFAULT_WEBGL);
        //ENABLE BLEND AND CLEAR THE CANVAS
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        this.gl = gl;
        this.shaders = new Shaders(this);
    }
}

export default WebGL;
