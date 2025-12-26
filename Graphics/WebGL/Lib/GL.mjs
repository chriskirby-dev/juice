/**
 * WebGL utilities for 3D graphics rendering.
 * @module Graphics/WebGL/Lib/GL
 */

import Shader from "./Shader.mjs";
import Plane from "./Plane.mjs";

/**
 * GL class provides WebGL utilities for shader and geometry management.
 * @class GL
 */
class GL {
    /**
     * Creates a new GL instance.
     */
    constructor() {
        this._gl = null;
    }

    plane(width, height, subdivisionsX, subdivisionsY) {
        return new Plane(width, height, subdivisionsX, subdivisionsY);
    }

    addPlane(plane) {
        //Create Buffers
        const verticesBuffer = this._gl.createBuffer();
        const uvsBuffer = this._gl.createBuffer();
        const trianglesBuffer = this._gl.createBuffer();
        const normalsBuffer = this._gl.createBuffer();
        const colorsBuffer = this._gl.createBuffer();

        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, verticesBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(plane.vertices), this._gl.STATIC_DRAW);
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, uvsBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(plane.uvs), this._gl.STATIC_DRAW);
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, trianglesBuffer);
        this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(plane.triangles), this._gl.STATIC_DRAW);
    }

    createShader(type) {
        return new Shader(type);
    }

    program(vertexShader, fragmentShader) {
        const { _gl: gl } = this;

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }
}

export default GL;