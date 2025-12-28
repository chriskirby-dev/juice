/**
 * Shader collection and factory for common shader types.
 * Provides predefined shaders and shader creation utilities.
 * @module Graphics/WebGL/Lib/Shaders
 */

import { VariableTypes } from "./Variable.mjs";
import { Shader } from "./Shader.mjs";

/**
 * Shader type constants.
 * @type {Object}
 */
export const ShaderTypes = {
    VERTEX: "VERTEX_SHADER",
    FRAGMENT: "FRAGMENT_SHADER",
    has(shaderType) {
        return Object.values(ShaderTypes).includes(shaderType);
    },
};

import ShaderBuilder from "./ShaderBuilder.mjs";

/**
 * 

A vertex shader and a fragment shader are both essential components of the programmable pipeline in modern graphics programming (such as OpenGL or WebGL), but they serve different purposes and operate at different stages in the rendering process.

1. Vertex Shader
Purpose: Processes each vertex of a 3D object.
Responsibilities:
Transforms vertices from object space to clip space (via matrices like the model-view-projection matrix).
Handles vertex attributes like position, normals, texture coordinates, and colors.
Can perform per-vertex operations like lighting or deformation (such as skeletal animation).
Outputs data (such as transformed position and other attributes) to be passed to the fragment shader.
Input: Receives vertex attributes (e.g., positions, normals, UVs).
Output: Provides transformed vertex positions and data for the fragment shader to use.
Example: A vertex shader might take the position of a vertex in 3D space, apply a matrix transformation to convert it to screen space, and pass texture coordinates and other data to the next stage.

2. Fragment Shader (also known as Pixel Shader)
Purpose: Processes each fragment (which corresponds to a potential pixel on the screen).
Responsibilities:
Computes the final color of a pixel.
Handles operations like texture mapping, lighting, and color blending.
Performs per-fragment (per-pixel) operations such as applying shadows, transparency, or post-processing effects.
Input: Receives interpolated data from the vertex shader (e.g., color, texture coordinates, normals).
Output: Provides the final color (and optionally depth and other information) for each pixel.
Example: A fragment shader might use the interpolated texture coordinates from the vertex shader to fetch a color from a texture and apply lighting calculations to determine the final pixel color.

Key Differences:
Stage: The vertex shader operates on vertices (points), while the fragment shader operates on fragments (potential pixels).
Function: The vertex shader focuses on geometry transformations, and the fragment shader focuses on pixel-level coloring and shading.
Execution Frequency: A vertex shader is executed once per vertex, while a fragment shader is executed once per pixel.
Together, the vertex and fragment shaders work in tandem to render 3D objects onto the screen with the desired appearance, from geometry to final color.
 
vac2 2 property types
x, y

vec4 4 property types
x, y, z, w

*/

export class Shaders {
    static VERTEX_TYPE = ShaderTypes.VERTEX;
    static FRAGMENT_TYPE = ShaderTypes.FRAGMENT;
    static COMPUTE_TYPE = ShaderTypes.COMPUTE;
    static GEOMETRY_TYPE = ShaderTypes.GEOMETRY;

    vertex;
    fragment;
    varying = {};
    version = 2;

    constructor(webgl) {
        this.webgl = webgl;
        this.gl = webgl.gl;
        this.version = webgl.version;
        this.vertex = new Shader(ShaderTypes.VERTEX, { webgl, version: this.version });
        this.fragment = new Shader(ShaderTypes.FRAGMENT, { webgl, version: this.version });
    }

    get(SHADER_TYPE) {
        if (SHADER_TYPE === ShaderTypes.VERTEX) return this.vertex;
        if (SHADER_TYPE === ShaderTypes.FRAGMENT) return this.fragment;
    }

    onProgram(program) {
        this.program = program;
        this.vertex.onProgramLoaded(program);
        this.fragment.onProgramLoaded(program);
    }

    getVar(shader, name) {}

    /**
     * 
     * They typically store data that is different for each vertex, such as:
        Vertex positions
        Normals
        Texture coordinates
        Colors
        Scope: Attributes are only available in the vertex shader.
     */
    addAttribute(name, type, options) {
        this.vertex.addVariable("attribute", name, type, options);
    }

    /**
     *
     * Uniform variables are used to pass constant data from the application to both the vertex shader and the fragment shader.
     * These are values that remain constant across a single draw call (but can change between draw calls), such as
     * the projection and view matrices.
     * Uniforms are available to both the vertex and fragment shaders.
     */
    addUniform(name, type, options) {
        //this.vertex.addVariable("uniform", name, type, options);
        //this.fragment.addVariable("uniform", name, type, options);
    }

    addVarying(name, type, options) {
        this.vertex.addVariable("varying", name, type, options);
        this.fragment.addVariable("varying", name, type, options);
    }

    /*************  ✨ Codeium Command ⭐  *************/
    /**
     * Builds the shaders and returns an object with the vertex and fragment
     * shaders. The object returned has the following properties:
     *
     * - vertex: The vertex shader as a string.
     * - fragment: The fragment shader as a string.
     *
     * @returns {Object} An object with the vertex and fragment shaders.
     */
    /******  d225aa5a-4a07-4f2d-8786-f71497c588d7  *******/
    build() {
        return {
            vertex: this.vertex.build(),
            fragment: this.fragment.build(),
        };
    }

    bindProgram(program) {
        this.gl = program.gl;
        this.program = program;
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        this.vertex.bindProgram(program);
        this.fragment.bindProgram(program);
    }
}

export default Shaders;