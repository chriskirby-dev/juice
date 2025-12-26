/**
 * WebGL Texture management with event-based loading.
 * @module Graphics/WebGL/Lib/Texture
 */

import Emitter from "../../../Event/Emitter.mjs";

/**
 * Texture class manages WebGL textures with image loading support.
 * Extends Emitter to emit 'ready' event when texture is loaded.
 * @class Texture
 * @extends Emitter
 */
class Texture extends Emitter {
    static context = null;

    /**
     * Creates a texture from a data URL.
     * @param {string} dataURL - The data URL containing the image
     * @returns {Texture} New texture instance
     * @static
     */
    static fromDataUrl(dataURL) {
        const image = new Image();
        image.src = dataURL;
        return new Texture(image);
    }

    constructor(image, gl = Texture.context) {
        super();
        this.image = image;
        this.gl = gl;

        this.initialize();
    }

    initialize() {
        const { gl } = this;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

        /* gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
       */
        this.native = texture;

        if (this.image.complete) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
            this.emit("ready");
        } else {
            this.image.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
                gl.generateMipmap(gl.TEXTURE_2D);
                this.emit("ready");
            };
        }
    }
}

export default Texture;