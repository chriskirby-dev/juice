import Shader from "./Lib/Shader.mjs";
import Program from "./Lib/Program.mjs";
import Texture from "./Lib/Texture.mjs";

const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;

    uniform vec2 u_offset;
    uniform vec2 u_offset2;

    varying vec2 v_texCoord;
    varying vec2 v_texCoord2;

    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord + u_offset;
        v_texCoord2 = a_texCoord + u_offset2;
    }
`;

const fragmentShaderSource = `

    precision mediump float;

    varying vec2 v_texCoord;
    varying vec2 v_texCoord2;

    uniform sampler2D u_texture;
    uniform sampler2D u_texture2;
    uniform float u_blendFactor; // Factor to blend between the two textures
    uniform vec2 u_canvasSize;

    void main() {
        vec2 scaledTexCoord = v_texCoord * u_canvasSize; // Scale texture coordinates by canvas size
        vec4 color = texture2D(u_texture, v_texCoord);
        vec4 color2 = texture2D(u_texture2, v_texCoord2);
        // Output the color with the correct alpha channel
        vec4 blendedColor = mix(color, color2, u_blendFactor);
        blendedColor.a = max(color.a, color2.a);
        gl_FragColor = blendedColor * 1.1;

    }
`;

function nearestPowerOfTwo(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

class ScrollingBackground {
    locations = {};

    /**
     * Creates a new instance of the ScrollingBackground class.
     * @constructor
     * @param {HTMLElement} container - The container element where the background is rendered.
     * @param {HTMLImageElement} image - The image to be used as the background.
     */
    constructor(container, canvas, canvas2) {
        /**
         * The container element where the background is rendered.
         * @type {HTMLElement}
         */
        this.container = container;

        /**
         * The image to be used as the background.
         * @type {HTMLImageElement}
         */
        this.dataURL = null;

        this.textureCanvas = canvas;
        this.textureCanvas2 = canvas2;
        /**
         * The current scroll position of the background.
         * @type {number}
         */
        this.scroll = 0;

        /**
         * The speed at which the background scrolls. Adjust this value to control the scrolling speed.
         * @type {number}
         */
        this.speed = 0.001;

        /**
         * The initial X offset of the background.
         * @type {number}
         */
        this.offsetX = 0.0;
        this.offset2X = 0.0;

        /**
         * The initial Y offset of the background.
         * @type {number}
         */
        this.offsetY = 0.0;
        this.offset2Y = 0.0;
        /**
         * Initializes the background.
         */
        this.initialize();
    }

    move(x, y) {
        this.offsetX += x;
        this.offsetY += y;
    }

    set(x, y) {
        this.offsetX = x;
        this.offsetY = y;
    }

    setupTexture(canvas, unit) {
        const { gl } = this;
        const texture = gl.createTexture();
        gl.activeTexture(gl[`TEXTURE${unit}`]);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
        return texture;
    }

    update(x, y) {
        this.offsetX = x;
        this.offsetY = y;
    }

    /**
     * Renders the background at the specified position.
     * @param {number} x The X coordinate of the position to render the background at.
     * @param {number} y The Y coordinate of the position to render the background at.
     */
    render() {
        if (!this.ready) return;
        // console.log(`ScrollingBackground.render(${this.offsetX}, ${this.offsetY})`);
        const { gl } = this;
        // Set the position offset of the background
        gl.uniform2f(this.locations.canvasSize, this.width, this.height);

        // Update the offset (move the texture)

        // Pass the offset to the shader
        gl.uniform2f(this.locations.offset, this.offsetX, this.offsetY);
        gl.uniform2f(this.locations.offset2, this.offsetX * 0.8, this.offsetY * 0.8);

        gl.uniform1f(this.locations.blendFactor, 0.5);
        // Draw the quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Request the next frame
    }

    /**
     * Builds the scrolling background by creating a texture and loading an image.
     */
    build() {}

    initialize() {
        const self = this;

        const rect = this.container.getBoundingClientRect();
        this.height = rect.height;
        this.width = rect.width;

        const canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        this.container.appendChild(canvas);

        this.canvas = canvas;

        this.gl = this.canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true });

        const { gl } = this;
        //UNPACK_PREMULTIPLY_ALPHA_WEBGL

        // gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        const vertexShader = new Shader("VERTEX_SHADER", { gl: gl, version: 1 });
        vertexShader.build(vertexShaderSource);
        const fragmentShader = new Shader("FRAGMENT_SHADER", { gl: gl, version: 1 });
        fragmentShader.build(fragmentShaderSource);
        const program = new Program(gl, vertexShader, fragmentShader);
        this.program = program;

        gl.useProgram(program.native);

        const positions = new Float32Array([
            -1.0,
            -1.0, // Bottom left
            1.0,
            -1.0, // Bottom right
            -1.0,
            1.0, // Top left
            1.0,
            1.0, // Top right
        ]);

        // If you want to adjust the texture coordinates based on canvas size:
        const texCoords = new Float32Array([
            0.0,
            0.0, // Bottom left
            1.0,
            0.0, // Bottom right
            0.0,
            1.0, // Top left
            1.0,
            1.0, // Top right
        ]);

        program.createBuffer("position", "ARRAY_BUFFER", positions, { usage: "STATIC_DRAW" });
        program.createBuffer("texCoord", "ARRAY_BUFFER", texCoords, { usage: "STATIC_DRAW" });

        this.locations.position = program.attribLocation("a_position");
        this.locations.texCoord = program.attribLocation("a_texCoord");

        this.locations.offset = program.uniformLocation("u_offset");
        this.locations.offset2 = program.uniformLocation("u_offset2");
        this.locations.canvasSize = program.uniformLocation("u_canvasSize");

        this.locations.texture = program.uniformLocation("u_texture");
        this.locations.texture2 = program.uniformLocation("u_texture2");
        this.locations.blendFactor = program.uniformLocation("u_blendFactor");

        gl.uniform1f(this.locations.brightness, 3.5);
        // Pass the canvas size as a uniform to the shader
        gl.uniform2f(this.locations.canvasSize, this.textureCanvas.width, this.textureCanvas.height);

        gl.enableVertexAttribArray(this.locations.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.program.buffer("position"));
        gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
        // Enable the vertex attribute arrays
        gl.enableVertexAttribArray(this.locations.texCoord);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.program.buffer("texCoord"));
        gl.vertexAttribPointer(this.locations.texCoord, 2, gl.FLOAT, false, 0, 0);

        this.texture = this.setupTexture(this.textureCanvas, 0);
        this.texture2 = this.setupTexture(this.textureCanvas2, 1);

        // Set texture units
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.locations.texture, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.texture2);
        gl.uniform1i(this.locations.texture2, 1);

        // Set blend factor
        gl.uniform1f(this.locations.blendFactor, 0.5); // Example blend factor

        self.ready = true;

        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error("WebGL Error:", error);
        }

        self.render();
    }
}

export default ScrollingBackground;
