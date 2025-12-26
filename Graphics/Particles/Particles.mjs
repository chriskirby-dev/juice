/**
 * Particle system for 3D graphics with GPU acceleration.
 * @module Graphics/Particles/Particles
 */

import PerspectiveProjection from "../Projection/Perspective.mjs";

import Transition from "../../Animation/Transitions/Transition.mjs";
import { random, randomInt, randomIntBetween, randomBetween, cos, sin } from "../../Util/Math.mjs";
import { lerp } from "../../Util/Geometry.mjs";

/**
 * Particles class manages a particle system with positions, velocities, colors, and transitions.
 * @class Particles
 */
class Particles {
    config = {
        normalize: true,
        maxSpeed: 0.5,
    };

    normals = {
        top: 1,
        right: -1,
        bottom: -1,
        left: 1,
        width: 2,
        height: 2,
    };

    coords;

    constructor(maxCount, width, height) {
        maxCount = 100;
        this.maxCount = maxCount;
        this.positions = new Float32Array(maxCount * 3);
        this.lifes = new Float32Array(maxCount);
        this.velocities = new Float32Array(maxCount * 3);
        this.destinations = new Float32Array(maxCount * 3);
        this.colors = new Float32Array(maxCount * 4);
        this.sizes = new Float32Array(maxCount);
        this.states = new Float32Array(maxCount * 4);
        //StartTime, Duration, Easing, Complete
        this.transitions = new Float32Array(maxCount * 4);

        this.masks = [];

        this.resize(width, height);
    }

    setProjection(projectionType, options) {
        const { width = this.width, height = this.height, near, far } = options;
        let projectionMatrix;

        this.projection = { type: projectionType, width, height, near, far, options };

        switch (projectionType) {
            case "perspective":
                const { fov } = options;
                this.projection = new PerspectiveProjection(fov, width / height, near, far);
                break;

            case "orthographic":
                const { left, right, bottom, top } = options;
                projectionMatrix = mat4.create();
                Object.assign(this.projection, { left, right, bottom, top });
                mat4.ortho(
                    projectionMatrix,
                    left || -width / 2, // left plane
                    right || width / 2, // right plane
                    bottom || -height / 2, // bottom plane
                    top || height / 2, // top plane
                    near, // near clipping plane
                    far // far clipping plane
                );
                break;

            default:
                throw new Error('Unknown projection type. Use "perspective" or "orthographic".');
        }

        return this.projection.matrix;
    }

    loadMask(source) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const image = new Image();
        return new Promise((resolve) => {
            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data; // RGBA array
                const mapped = [];
                // Iterate over every pixel
                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const index = (y * canvas.width + x) * 4; // Each pixel has 4 values (R, G, B, A)
                        // Check if the pixel is non-transparent (A > 0)
                        if (pixels[index + 3] > 0) {
                            mapped.push({ x, y });
                        }
                    }
                }
                const mask = new Float32Array(mapped.length * 2);
                const imageNormWidth = (image.width / this.width) * this.normals.width;
                const imageNormHeight = (image.height / this.height) * this.normals.height;
                for (let i = 0; i < mapped.length; i++) {
                    const i4 = i * 4;
                    mask[i4] = (mapped[i].x / canvas.width) * imageNormWidth; // Normalize X to [-1, 1]
                    mask[i4 + 1] = (mapped[i].y / canvas.height) * imageNormHeight; // Normalize Y to [1, -1]
                }

                this.masks.push(mask);
                resolve(this.masks.length - 1);
            };
        });
    }

    setMask(maskIndex) {
        this.mask = this.masks[maskIndex];
        return this.getDestinations();
    }

    getDestinations(maskIndex) {
        const mask = maskIndex ? this.masks[maskIndex] : this.mask;

        const count = Math.min(this.maxCount, mask ? mask.length / 2 : this.maxCount);
        const exclude = [];
        for (let i = 0; i < this.maxCount; i++) {
            const i2 = i * 2;
            const i3 = i * 3;
            const i4 = i * 4;
            if (i < count) {
                this.destinations[i3] = null;
                this.destinations[i3 + 1] = null;
                this.destinations[i3 + 2] = null;
                continue;
            }
            if (mask) {
                const pi = randomIntBetween(0, mask.length / 2, exclude);
                exclude.push(pi);
                const x = mask[pi * 2];
                const y = mask[pi * 2 + 1];
                this.destinations[i3] = x;
                this.destinations[i3 + 1] = y;
                this.destinations[i3 + 2] = 0;
            } else {
                this.destinations[i3] = randomBetween(-1, 1);
                this.destinations[i3 + 1] = randomBetween(-1, 1);
                this.destinations[i3 + 2] = 0;
            }
        }

        return this.destinations;
    }

    build(maskIndex, options = {}) {
        const mask = maskIndex ? this.masks[maskIndex] : this.mask;
        const aspectRatio = this.width / this.height;
        const count = Math.min(this.maxCount, maskIndex ? this.masks[maskIndex].length / 2 : this.maxCount);
        const exclude = [];
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const i4 = i * 4;
            const i2 = i * 2;
            if (mask) {
                const pi = randomIntBetween(0, mask.length / 2, exclude);

                exclude.push(pi);
                const x = mask[pi * 2];
                const y = mask[pi * 2 + 1];
                this.positions[i3] = x;
                this.positions[i3 + 1] = y;
                this.positions[i3 + 2] = 0;
            } else {
                //Get Depth Position
                const { near, far, fov } = this.projection;

                const zPosition = randomBetween(-near, -far);
                const { left, right, top, bottom } = this.projection.getBoundsAtDepth(zPosition);

                // console.log(left, right, top, bottom);
                this.positions[i3] = randomBetween(left, right);
                this.positions[i3 + 1] = randomBetween(top, bottom);
                this.positions[i3 + 2] = zPosition;
            }

            this.states[i4] = 0;
            this.states[i4 + 1] = 0;
            this.states[i4 + 2] = Math.random();
            this.states[i4 + 3] = 0;

            this.velocities[i3] = randomBetween(-this.config.maxSpeed, this.config.maxSpeed);
            this.velocities[i3 + 1] = randomBetween(-this.config.maxSpeed, this.config.maxSpeed);
            this.velocities[i3 + 2] = 0;
            this.lifes[i] = 0;
            this.colors[i4] = 1;
            this.colors[i4 + 1] = 1;
            this.colors[i4 + 2] = 1;
            this.colors[i4 + 3] = 1;
            this.sizes[i] = 1;
        }

        this.count = count;
    }

    update(delta) {
        for (let i = 0; i < this.maxCount; i++) {
            const i3 = i * 3;
            const i4 = i * 4;
            const i2 = i * 2;
            this.velocities[i3] = lerp(this.velocities[i3], this.destinations[i3], delta);
            this.velocities[i3 + 1] = lerp(this.velocities[i3 + 1], this.destinations[i3 + 1], delta);
            this.velocities[i3 + 2] = lerp(this.velocities[i3 + 2], this.destinations[i3 + 2], delta);

            this.positions[i3] += this.velocities[i3] * delta;
            this.positions[i3 + 1] += this.velocities[i3 + 1] * delta;
            this.positions[i3 + 2] += this.velocities[i3 + 2] * delta;

            this.lifes[i] += delta;
        }
    }

    /**
     * Resizes the canvas and adjusts the normal coordinates of the points.
     * @param {number} width The new width of the canvas.
     * @param {number} height The new height of the canvas.
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.aspectRatio = width / height;

        if (this.aspectRatio > 1) {
            this.normals.left = -this.aspectRatio;
            this.normals.right = this.aspectRatio;
            this.normals.width = 2 * this.aspectRatio;
        } else {
            this.normals.top = this.aspectRatio;
            this.normals.bottom = -this.aspectRatio;
            this.normals.height = 2 * this.aspectRatio;
        }
        if (this.projection) {
            this.setProjection(this.projection.type, this.projection.options);
        }
    }

    get(index) {
        const i3 = index * 3;
        const i4 = index * 4;
        return {
            x: this.positions[i3],
            y: this.positions[i3 + 1],
            z: this.positions[i3 + 2],
            vx: this.velocities[i3],
            vy: this.velocities[i3 + 1],
            vz: this.velocities[i3 + 2],
            destinationX: this.destinations[i3],
            destinationY: this.destinations[i3 + 1],
            destinationZ: this.destinations[i3 + 2],
            color: {
                r: this.colors[i4],
                g: this.colors[i4 + 1],
                b: this.colors[i4 + 2],
                a: this.colors[i4 + 3],
            },
            size: this.sizes[index],
            life: this.lifes[index],
        };
    }

    scatter() {
        const { normals } = this;
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            const i4 = i * 4;
            this.destinations[i3] = randomBetween(normals.left, normals.right);
            this.destinations[i3 + 1] = randomBetween(normals.top, normals.bottom);
            this.destinations[i3 + 2] = randomBetween(-1, 1);
        }
    }

    update(time) {}

    render() {}
}

export default Particles;