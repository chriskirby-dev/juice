/**
 * Perspective projection matrix for 3D rendering.
 * Creates projection matrices for WebGL perspective rendering.
 * @module Graphics/Projection/Perspective
 */

import { mat4 } from "../Matrix/Mat4.mjs";

/**
 * Perspective projection for 3D graphics.
 * @class PerspectiveProjection
 */
class PerspectiveProjection {
    constructor(fov, aspect, near, far) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.matrix = this.getMatrix();
    }

    getMatrix() {
        const fieldOfView = (this.fov * Math.PI) / 180; // Field of View in radians
        const aspectRatio = this.aspect;
        const near = this.near;
        const far = this.far;

        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fieldOfView, aspectRatio, near, far);

        return projectionMatrix;
    }

    getBoundsAtDepth(depth) {
        const { fov: fovY, aspect: aspectRatio, near, far } = this;

        if (-depth < near || -depth > far) {
            throw new Error("Depth must be within the near and far planes.");
        }

        // Convert field of view from degrees to radians
        const fovYRadians = (fovY * Math.PI) / 180;

        // Calculate the height at the given depth
        const halfHeight = -depth * Math.tan(fovYRadians / 2);

        // Calculate the width using the aspect ratio
        const halfWidth = halfHeight * aspectRatio;

        // Return the left, right, top, and bottom coordinates
        return {
            left: -halfWidth,
            right: halfWidth,
            top: halfHeight,
            bottom: -halfHeight,
        };
    }
}

export default PerspectiveProjection;