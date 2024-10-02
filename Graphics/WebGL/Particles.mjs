import { createProgram } from "./Lib/Helper.mjs";
import { random, randomInt } from "../../Util/Math.mjs";

const VERTEX_SOURCE = `
attribute vec2 aPosition;  // Initial position
attribute vec2 aVelocity;  // Initial velocity
attribute float aLife;     // Particle lifetime

uniform float uTime;       // Global time uniform to animate particles
uniform vec2 uForce;       // External force (e.g., gravity)
uniform vec2 uRepelPoint;  // Point to repel from
uniform bool uRepel;       // Flag to apply repulsion

varying float vLife;       // Remaining life of the particle

void main() {
    // Compute particle's current life
    float life = aLife - uTime;

    // Update position based on time and velocity
    vec2 position = aPosition + aVelocity * uTime;

    // Apply external force (e.g., gravity or wind)
    position += uForce * uTime;

    // Apply repulsion if enabled
    if (uRepel) {
        vec2 repelDir = normalize(position - uRepelPoint);
        float distance = length(position - uRepelPoint);
        position += repelDir * (1.0 / distance) * uTime;
    }

    // Pass the updated position to the next stage
    gl_Position = vec4(position, 0.0, 1.0);

    // Send the updated life value to the fragment shader for fading
    vLife = life;
}

`;

const FRAGMENT_SOURCE = `
    precision mediump float;

    varying float vLife;  // Particle life passed from the vertex shader

    void main() {
        // Fade the particle as it loses life
        float alpha = smoothstep(0.0, 1.0, vLife);
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
    }

`;

class Particles {
    constructor(gl, maxParticles, emitRate = 10) {
        this.gl = gl;
        this.maxParticles = maxParticles;
        this.emitRate = emitRate; // Particles per second
        this.time = 0;
        this.emitterPosition = [0, 0]; // Emitter position
        this.force = [0, -0.1]; // Default force (gravity)

        // Initialize particle buffers
        this.initBuffers();
        this.initShaders();
    }

    initBuffers() {
        // Create buffer for initial particle positions
        this.positionBuffer = this.gl.createBuffer();
        this.velocityBuffer = this.gl.createBuffer();
        this.lifeBuffer = this.gl.createBuffer();

        // Populate with initial data (random positions and velocities)
        const positions = [];
        const velocities = [];
        const lifetimes = [];

        for (let i = 0; i < this.maxParticles; i++) {
            positions.push(random(2 - 1), Math.random(2) - 1); // Random initial position
            velocities.push(random(0.1) - 0.05, random(0.1) - 0.05); // Random velocity
            lifetimes.push(random(1.0) + 0.5); // Random life duration
        }

        // Upload initial data to the GPU
        this.uploadBuffer(this.positionBuffer, positions, 2);
        this.uploadBuffer(this.velocityBuffer, velocities, 2);
        this.uploadBuffer(this.lifeBuffer, lifetimes, 1);
    }

    initShaders() {
        const vertexShaderSource = `...`; // Vertex shader source (see earlier)
        const fragmentShaderSource = `...`; // Fragment shader source (see earlier)

        this.program = createProgram(this.gl, VERTEX_SOURCE, FRAGMENT_SOURCE);
        this.gl.useProgram(this.program);

        // Get attribute and uniform locations
        this.positionAttrib = this.gl.getAttribLocation(this.program, "aPosition");
        this.velocityAttrib = this.gl.getAttribLocation(this.program, "aVelocity");
        this.lifeAttrib = this.gl.getAttribLocation(this.program, "aLife");
        this.timeUniform = this.gl.getUniformLocation(this.program, "uTime");
        this.forceUniform = this.gl.getUniformLocation(this.program, "uForce");
        this.repelPointUniform = this.gl.getUniformLocation(this.program, "uRepelPoint");
        this.repelUniform = this.gl.getUniformLocation(this.program, "uRepel");
    }

    uploadBuffer(buffer, data, size) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.positionAttrib, size, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.positionAttrib);
    }

    update(timeDelta) {
        this.time += timeDelta;

        // Update the time uniform on the GPU
        this.gl.uniform1f(this.timeUniform, this.time);
        this.gl.uniform2f(this.forceUniform, this.force[0], this.force[1]);

        // Set repulsion uniform (can toggle dynamically)
        this.gl.uniform1i(this.repelUniform, false); // Example: no repulsion

        // Render particles without uploading any position data!
        this.gl.drawArrays(this.gl.POINTS, 0, this.maxParticles);
    }
}

export default Particles;
