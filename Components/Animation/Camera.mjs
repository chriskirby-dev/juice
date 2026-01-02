/**
 * Camera controller for animation viewer with target following and filters.
 * Manages viewport position and applies visual filters to the stage.
 * @module Components/Animation/Camera
 */

import Filters from "./filters/Filters.mjs";

/**
 * Camera for controlling viewport position and applying filters.
 * @class Camera
 * @param {Object} viewer - The animation viewer instance
 * @example
 * const camera = new Camera(viewer);
 * camera.follow(target);
 * camera.filter.start('shake', {intensity: 5});
 */
class Camera {
    width = 0;
    height = 0;
    target = null;
    max = {
        x: 0,
        y: 0,
        z: 0
    };
    min = {
        x: 0,
        y: 0,
        z: 0
    };

    constructor(viewer) {
        this.viewer = viewer;
        this.last = { x: 0, y: 0, z: 0 };
        this.delta = { x: 0, y: 0, z: 0 };
    }

    set x(value) {
        if (!this.viewer.stage) return;
        this.viewer.stage.position.x = -value;
    }

    set y(value) {
        if (!this.viewer.stage) return;
        this.viewer.stage.position.y = -value;
    }

    set z(value) {
        // Z is not used in 2D stages, but kept for 3D compatibility
        if (!this.viewer.stage || !this.viewer.stage.position.z) return;
        this.viewer.stage.position.z = -value;
    }

    get x() {
        return this.viewer.stage?.position.x || 0;
    }

    get y() {
        return this.viewer.stage?.position.y || 0;
    }

    get z() {
        // Z is not used in 2D stages, but kept for 3D compatibility
        return this.viewer.stage?.position.z || 0;
    }

    follow(target) {
        this.target = target;
    }

    filters = [];
    activeFilters = [];
    get filter() {
        return {
            start(type, options = {}) {
                const cam = this;
                this.activeFilters.push(type);
                this.filters.push(Filters[type](options, cam));
            },
            stop(type) {
                this.activeFilters.filter((t) => t !== type);
                this.filters = this.filters.filter((f) => f.type !== type);
            },
            update(type, options) {
                const index = this.activeFilters.indexOf(type);
                if (index > -1) {
                    this.filters[index].options;
                }
            }
        };
    }

    update(time) {
        if (!this.viewer.stage) return;

        this.last = { x: this.x, y: this.y, z: this.z };

        if (this.target) {
            // Follow target position
            if (this.target.position) {
                // Center camera on target
                const targetX = this.target.position.x - this.width / 2;
                const targetY = this.target.position.y - this.height / 2;

                // Update camera position (which updates stage via setters)
                this.x = targetX;
                this.y = targetY;

                if (this.target.position.z !== undefined) {
                    this.z = this.target.position.z;
                }
            }
            // Handle frozen target with velocity
            else if (this.target.frozen && this.target.velocity && this.target.velocity.dirty) {
                this.x += this.target.velocity.x;
                this.y += this.target.velocity.y;

                if (this.target.velocity.z !== undefined) {
                    this.z += this.target.velocity.z;
                }
            }
        }

        // Clamp to bounds
        if (this.x < this.min.x) this.x = this.min.x;
        if (this.y < this.min.y) this.y = this.min.y;
        if (this.z < this.min.z) this.z = this.min.z;
        if (this.x > this.max.x) this.x = this.max.x;
        if (this.y > this.max.y) this.y = this.max.y;
        if (this.z > this.max.z) this.z = this.max.z;

        // Calculate delta for filters/effects
        this.delta = {
            x: this.x - this.last.x,
            y: this.y - this.last.y,
            z: this.z - this.last.z
        };
    }

    render() {}
}

export default Camera;
