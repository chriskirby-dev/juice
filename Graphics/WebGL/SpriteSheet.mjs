import Shader from "./Lib/Shader.mjs";
import Program from "./Lib/Program.mjs";
import Texture from "./Lib/Texture.mjs";
import * as WebGLHelper from "./Lib/Helper.mjs";
const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;

    uniform vec2 u_offset;

    varying vec2 v_texCoord;

    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord + u_offset;
    }
`;

const fragmentShaderSource = `

    precision mediump float;

    varying vec2 v_texCoord;

    uniform int uTextureCount;  
    uniform int uActiveTexture;  
    uniform sampler2D u_texture;
    uniform sampler2D uTextures[8];

    void main() {
        vec4 color = vec4(0.0);
        if(uActiveTexture == 0){
            color = texture2D(uTextures[0], v_texCoord);
        }else if(uActiveTexture == 1){
            color = texture2D(uTextures[1], v_texCoord);
        }
        gl_FragColor = texture2D(u_texture, v_texCoord);
    }
`;

function nearestPowerOfTwo(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

class SpriteSheet {
    sheets = [];

    locations = {
        textures: [],
    };

    rendered = {};

    textures = [];
    offsetX = 0;
    offsetY = 0;
    _frame = 0;
    /**
     * Creates a new instance of the ScrollingBackground class.
     * @constructor
     * @param {HTMLElement} container - The container element where the background is rendered.
     * @param {HTMLImageElement} image - The image to be used as the background.
     */
    constructor(width, height, container = null) {
        /**
         * The container element where the background is rendered.
         * @type {HTMLElement}
         */
        this.container = container;

        this.width = width;
        this.height = height;

        this.sheet = null;

        /**
         * The image to be used as the background.
         * @type {HTMLImageElement}
         */
        this.dataURL = null;

        this.textureCanvas = null;
        // this.textureCanvas2 = canvas2;

        /**
         * The initial X offset of the background.
         * @type {number}
         */
        this.offsetX = 0.0;

        /**
         * The initial Y offset of the background.
         * @type {number}
         */
        this.offsetY = 0.0;
        /**
         * Initializes the background.
         */

        this.initialize();
    }

    addSheet(source, frameWidth = this.width, frameHeight = this.height) {
        const { gl, program } = this;
        return new Promise((resolve, reject) => {
            WebGLHelper.loadTexture(gl, source).then((resp) => {
                const { texture, image } = resp;

                this.textures.push(texture);
                const index = this.locations.textures.length;
                this.locations.textures[index] = program.uniformLocation(`uTextures[${index}]`);
                gl.activeTexture(gl[`TEXTURE${index}`]);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.uniform1i(this.locations.textures[index], 0);

                const frameWidthP = this.width / image.width;
                const frameHeightP = this.height / image.height;
                this.frameWidth = frameWidthP;
                this.frameHeight = frameHeightP;

                const sheet = {};
                sheet.frameWidth = frameWidth;
                sheet.frameHeight = frameHeight;
                sheet.image = image;
                sheet.width = image.width;
                sheet.xInterval = this.width / image.width;
                sheet.height = image.height;
                sheet.columns = image.width / this.width;
                sheet.rows = image.height / this.height;
                sheet.texture = texture;

                this.sheets.push(sheet);
                this.sheet = sheet;

                const w = frameWidth / sheet.width;
                const h = frameHeight / sheet.height;
                sheet.coords = [0, 1, w, 1, 0, 0, 0, 0, w, 1, w, 0];
                console.log(sheet.coords);

                const texCoordBuffer = this.program.buffer("texCoord");
                gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sheet.coords), gl.DYNAMIC_DRAW);
                gl.vertexAttribPointer(this.locations.texCoord, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(this.locations.texCoord);

                gl.uniform1i(this.locations.activeTexture, index);

                gl.drawArrays(gl.TRIANGLES, 0, 6);
                this.ready = true;
                this.render(true);
                resolve();
            });
        });
    }

    useSheet(index) {
        const { gl, program } = this;
        const sheet = this.sheets[index];
        this.sheet = sheet;

        const texCoordBuffer = this.program.buffer("texCoord");
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sheet.coords), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.locations.texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.locations.texCoord);

        console.log(index);
        gl.uniform1i(this.locations.activeTexture, index);
    }

    move(x, y) {
        this.offsetX += x / this.sheet.width;
        this.offsetY += y / this.sheet.height;
        this.dirty = true;
    }

    set(x, y) {
        this.offsetX = x / this.sheet.width;
        this.offsetY = y / this.sheet.height;
        this.dirty = true;
    }

    update(x, y) {
        this.offsetX = x;
        this.offsetY = y;
        this.dirty = true;
    }

    setColumn(column, row = 1) {
        if (!this.sheet) return;
        column = column % this.sheet.columns;
        row = row % this.sheet.columns;
        this.offsetX = column * this.frameWidth;
        this.offsetY = row * this.frameHeight;
        this.dirty = true;
    }

    set frame(f) {
        if (!this.sheet) return;
        const column = f % this.sheet.columns;
        this.offsetX = column * this.sheet.xInterval;
        this._frame = f;
        this.dirty = true;
        this.render();
    }

    get frame() {
        return this._frame;
    }

    play(speed) {
        this.playing = true;
        if (this.sheet.xInterval) {
            this.offsetX += this.sheet.xInterval;
            if (this.offsetX + this.sheet.xInterval >= 1) this.offsetX = 0;
            this.render();
        }
        this.playTO = setTimeout(() => {
            this.play(speed);
        }, speed * 1000);
    }

    stop() {
        clearTimeout(this.playTO);
        this.playing = false;
    }

    /**
     * Renders the background at the specified position.
     * @param {number} x The X coordinate of the position to render the background at.
     * @param {number} y The Y coordinate of the position to render the background at.
     */
    render(force = false) {
        if (!force && (!this.ready || (this.offsetX == this.rendered.x && this.offsetY == this.rendered.y))) return;
        // console.log(`ScrollingBackground.render(${this.offsetX}, ${this.offsetY})`);
        const { gl } = this;

        // Pass the offset to the shader
        gl.uniform2f(this.locations.offset, this.offsetX, this.offsetY);

        this.rendered = {
            x: this.offsetX,
            y: this.offsetY,
        };

        // Draw the quad
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Request the next frame
    }

    initialize() {
        console.log("SPRITESHEET INITIALIZE");

        const canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        canvas.style.position = "absolute";
        canvas.style.top = 0;
        canvas.style.left = 0;
        this.container.appendChild(canvas);
        this.canvas = canvas;

        this.gl = this.canvas.getContext("webgl", { alpha: true });

        const { gl } = this;

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        console.log(vertexShaderSource);
        const vertexShader = new Shader("VERTEX_SHADER", { gl: gl, version: 1 });
        vertexShader.build(vertexShaderSource);
        const fragmentShader = new Shader("FRAGMENT_SHADER", { gl: gl, version: 1 });
        fragmentShader.build(fragmentShaderSource);
        const program = new Program(gl, vertexShader, fragmentShader);
        this.program = program;

        gl.useProgram(program.native);

        const positions = [
            -1,
            -1,
            1,
            -1,
            -1,
            1,
            -1,
            1,
            1,
            -1,
            1,
            1, // Full quad
        ];

        // If you want to adjust the texture coordinates based on canvas size:
        const texCoords = [
            0,
            1,
            1,
            1,
            0,
            0,
            0,
            0,
            1,
            1,
            1,
            0, // Full quad
        ];

        program.createBuffer("position", "ARRAY_BUFFER", positions, { usage: "STATIC_DRAW" });
        program.createBuffer("texCoord", "ARRAY_BUFFER", texCoords, { usage: "STATIC_DRAW" });

        this.locations.position = program.attribLocation("a_position");
        this.locations.texCoord = program.attribLocation("a_texCoord");
        this.locations.offset = program.uniformLocation("u_offset");
        this.locations.texture = program.uniformLocation("u_texture");
        this.locations._textures = program.uniformLocation("uTextures");
        this.locations.activeTexture = program.uniformLocation("uActiveTexture");

        gl.uniform1i(this.locations.activeTexture, 0);

        gl.enableVertexAttribArray(this.locations.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.program.buffer("position"));
        gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
        // Enable the vertex attribute arrays
        gl.enableVertexAttribArray(this.locations.texCoord);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.program.buffer("texCoord"));
        gl.vertexAttribPointer(this.locations.texCoord, 2, gl.FLOAT, false, 0, 0);

        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error("WebGL Error:", error);
        }
        console.log(this.offsetX, this.offsetY, this.width, this.height);

        if (this.onready) this.onready();
    }
}

export default SpriteSheet;
