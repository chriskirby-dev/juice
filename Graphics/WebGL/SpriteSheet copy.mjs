/**
 * Alternative sprite sheet implementation for WebGL rendering.
 * Alternative/backup version of sprite sheet renderer with different implementation.
 * @module Graphics/WebGL/SpriteSheet copy
 * @deprecated This appears to be a backup/alternate version. Consider consolidating with SpriteSheet.mjs
 */

import WebGL from "./Lib/WebGL.mjs";
import { Shader, ShaderTypes } from "./Lib/Shader.mjs";
import Program from "./Lib/ProgramNew.mjs";
import Texture from "./Lib/Texture.mjs";

const { VariableTypes } = WebGL;

/**
 * Sprite sheet manager for texture atlas rendering.
 * @class SpriteSheet
 */
class SpriteSheet {
    program = null;
    sources = [];

    constructor(source, width, height, parent = null) {
        this.width = width;
        this.height = height;
        this.source = source;
        this.parent = parent;
        this.currentFrame = 0;
        this.initialize();
    }

    loadSource(src) {
        const self = this;
        return new Promise((resolve, reject) => {
            function onSourceLoaded(loaded) {
                self.rows = Math.ceil(loaded.height / self.height);
                self.columns = Math.ceil(loaded.width / self.width);
                resolve(loaded);
            }

            if (src instanceof Image) {
                this.sources.push(src);
                onSourceLoaded(src);
            } else if (typeof src == "string") {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    this.sources.push(img);
                    onSourceLoaded(img);
                };
                img.src = src;
            }
        });
    }

    appendTo(parent) {
        this.parent = parent;
        parent.appendChild(this.container);
        return this;
    }

    setFrame(frame) {
        this.currentFrame = frame;
        this.updateTextureCoordinates();
    }

    setIndex(column, row) {
        this.currentColumn = column;
        this.currentRow = row;
        this.updateTextureCoordinates();
    }

    loadSpriteSheet() {
        const { gl } = this.webgl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const placeholder = new Uint8Array([255, 255, 255, 255]); // white
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, placeholder);
        this.texture = texture;
        return this.loadSource(this.source).then((img) => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            return texture;
        });
    }

    setup() {
        const { gl, shaders } = this.webgl;

        const vertexShader = shaders.get(ShaderTypes.VERTEX);
        const fragmentShader = shaders.get(ShaderTypes.FRAGMENT);

        const positionVar = vertexShader.addInput("aPosition", VariableTypes.FLOAT_VEC4);
        const texCoordVar = vertexShader.addInput("aTexCoord", VariableTypes.FLOAT_VEC2);
        vertexShader.addOutput("vTexCoord", VariableTypes.FLOAT_VEC2);

        vertexShader.main(`
            gl_Position = aPosition;
            vTexCoord = aTexCoord;
        `);

        fragmentShader.setPrecision("medium", "float");

        fragmentShader.addInput("vTexCoord", VariableTypes.FLOAT_VEC2);
        fragmentShader.addOutput("outColor", VariableTypes.FLOAT_VEC4);
        fragmentShader.addUniform("uTexture", VariableTypes.SAMPLER_2D);

        fragmentShader.main(`
            outColor = texture(uTexture, vTexCoord.xy);
        `);

        const program = this.webgl.build();
        this.program = program;

        const positionLocation = gl.getAttribLocation(program, "aPosition");
        const texCoordLocation = gl.getAttribLocation(program, "aTexCoord");
        const textureLocation = gl.getUniformLocation(program, "uTexture");

        this.positionLocation = positionLocation;
        this.texCoordLocation = texCoordLocation;
        this.textureLocation = textureLocation;

        // Set up the geometry (a quad covering the canvas)
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
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
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        this.positionBuffer = positionBuffer;

        // Set up the texture coordinates
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
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
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        this.texCoordBuffer = texCoordBuffer;
        // Create and load texture
        const texture = gl.createTexture();
        this.texture = texture;
        const spriteSheet = new Image();
        spriteSheet.src = this.source; // Replace with your image path
        spriteSheet.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spriteSheet);
            gl.generateMipmap(gl.TEXTURE_2D);
            this.render(0, 0, this.width, this.height); // Example to show a 128x128 portion starting at (0,0)
        };
        this.spriteSheet = spriteSheet;
        //this.updateTextureCoordinates();
    }

    render(x, y, width, height) {
        const { gl, canvas, shaders, program } = this.webgl;
        const spriteSheet = this.spriteSheet;
        // Calculate texture coordinates based on sprite sheet and passed dimensions
        const texX1 = x / spriteSheet.width;
        const texX2 = (x + width) / spriteSheet.width;
        const texY1 = y / spriteSheet.height;
        const texY2 = (y + height) / spriteSheet.height;

        const texCoords = [texX1, texY2, texX2, texY2, texX1, texY1, texX1, texY1, texX2, texY2, texX2, texY1];

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        // Set up the position attribute
        gl.enableVertexAttribArray(this.positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Set up the texture coordinates attribute
        gl.enableVertexAttribArray(this.texCoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        // Bind the texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.textureLocation, 0);

        // Draw the quad (2 triangles)
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    initialize() {
        this.container = document.createElement("div");
        this.container.className = "sprite-sheet-container";
        this.container.style.width = this.width + "px";
        this.container.style.height = this.height + "px";

        this.webgl = new WebGL(this.container, this.width, this.height, { version: 2 });

        if (this.parent) {
            this.parent.appendChild(this.container);
        }

        this.setup();
    }
}

export default SpriteSheet;