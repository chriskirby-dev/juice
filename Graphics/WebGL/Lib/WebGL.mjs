import { Shaders, ShaderTypes } from "./Shaders.mjs";
import Texture from "./Texture.mjs";
import Program from "./Program.mjs";
import { VariableTypes, Variable } from "./Variable.mjs";

const PIXEL_STORE_METHODS = {
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: true,
    UNPACK_COLORSPACE_CONVERSION_WEBGL: true,
};

class WebGL {
    static Shaders = Shaders;
    static VariableTypes = VariableTypes;
    static Variable = Variable;
    static ShaderTypes = ShaderTypes;

    variables = {};

    textures = [];
    PIXEL_STORE_METHOD = "UNPACK_COLORSPACE_CONVERSION_WEBGL";
    shaders;

    constructor(parent, width = null, height = null, options = {}) {
        if (parent instanceof HTMLCanvasElement) {
            this.canvas = parent;
            parent = canvas.parentNode;
        }

        this.parent = parent;
        this.width = width;
        this.height = height;
        this.options = options;
        if (options.pixelStore) {
            this.PIXEL_STORE_METHOD = options.pixelStore;
        }

        this.version = options.version || 2;

        this.initialize();
    }

    getAttributeLocation(name) {
        const { gl } = this;
        return gl.getAttribLocation(this.program, name);
    }

    getUniformLocation(name) {
        const { gl } = this;
        return gl.getUniformLocation(this.program, name);
    }

    createTexture(image) {
        const texture = new Texture(image, this.gl);
        this.textures.push(texture);
        return texture;
    }

    build() {
        const { shaders, gl } = this;
        const { vertex, fragment } = shaders.build();

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertex);
        gl.attachShader(this.program, fragment);
        gl.linkProgram(this.program);

        var success = gl.getProgramParameter(this.program, gl.LINK_STATUS);
        if (success) {
            gl.useProgram(this.program);
            return this.program;
        }
        console.log(gl.getProgramInfoLog(this.program));
        gl.deleteProgram(this.program);
    }

    initialize() {
        if (!this.canvas) {
            this.canvas = document.createElement("canvas");
        }
        if (!this.width || !this.height) {
            this.width = this.canvas.width = this.parent.offsetWidth;
            this.height = this.canvas.height = this.parent.offsetHeight;
        } else {
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }
        if (this.canvas.parentNode !== this.parent) {
            this.parent.appendChild(this.canvas);
        }

        const contextType = this.version === 2 ? "webgl2" : "webgl";
        console.log(contextType);

        const gl = this.canvas.getContext(contextType, {
            alpha: true,
            premultipliedAlpha: true,
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

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
    }
}

export default WebGL;
