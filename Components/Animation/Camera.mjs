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
    x = 0;
    y = 0;
    z = 0;

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
    }

    set x(value) {
        this.viewer.stage.position.x = -value;
    }

    set y(value) {
        this.viewer.stage.position.y = -value;
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
        if (this.target) {
            if (this.target.frozen) {
                if (this.target.velocity.hasValue()) {
                    this.x += this.target.velocity.x;
                    this.y += this.target.velocity.y;
                    this.z += this.target.velocity.z;
                }
            }
        }

        if (this.x < this.min.x) this.x = this.min.x;
        if (this.y < this.min.y) this.y = this.min.y;
        if (this.z < this.min.z) this.z = this.min.z;
        if (this.x > this.max.x) this.x = this.max.x;
        if (this.y > this.max.y) this.y = this.max.y;
        if (this.z > this.max.z) this.z = this.max.z;
    }

    render() {}
}

export default Camera;