/**
 * Velocity class for managing velocity in Cartesian or polar coordinate systems.
 * Provides force application, friction, and coordinate system conversions.
 * @module Animation/Properties/Velocity
 */

import { AnimationValue } from "./Value.mjs";

/**
 * Represents velocity with support for Cartesian (x, y) and polar (angle, magnitude) coordinates.
 * Allows applying forces, friction, and converting between coordinate systems.
 * @class Velocity
 * @param {string} type - Coordinate system type ('cartesian' or 'polor')
 * @example
 * const vel = new Velocity('cartesian');
 * vel.x = 10;
 * vel.applyForce(5, 3);
 */
class Velocity {
    /** @type {string} Constant for Cartesian coordinate system */
    CARTESIAN = "cartesian";
    /** @type {string} Constant for polar coordinate system */
    POLOR = "polor";
    /** @type {Array<AnimationValue>} Internal coordinate storage */
    coords = [0, 0];
    
    /**
     * Creates a new Velocity instance.
     * @param {string} type - Coordinate system type
     */
    constructor(type) {
        this.type = type;
        this.coords[0] = new AnimationValue(0);
        this.coords[1] = new AnimationValue(0);
        this._angle = new AnimationValue(0);
    }

    /**
     * Gets the angle in polar coordinates.
     * @type {number}
     */
    get angle() {
        return this._angle.value;
    }

    /**
     * Sets the angle in polar coordinates.
     * @type {number}
     */
    set angle(angle) {
        this._angle.value = angle;
    }

    /**
     * Gets the X component of velocity.
     * @type {number}
     */
    get x() {
        return this.coords[0].value;
    }

    /**
     * Sets the X component of velocity.
     * @type {number}
     */
    set x(x) {
        this.coords[0].value = x;
    }

    /**
     * Gets the Y component of velocity.
     * @type {number}
     */
    get y() {
        return this.coords[1].value;
    }

    /**
     * Sets the Y component of velocity.
     * @type {number}
     */
    set y(y) {
        this.coords[1].value = y;
    }

    /**
     * Sets velocity using polar coordinates (magnitude and angle).
     * @param {number} value - Velocity magnitude
     * @param {number} [angle] - Angle in radians (uses current angle if not provided)
     */
    polor(value, angle) {
        this.angle = angle || this.angle || 0;
        this.coords[0].value = value * Math.cos(this.angle);
        this.coords[1].value = value * Math.sin(this.angle);
    }

    /**
     * Applies friction to reduce velocity.
     * @param {number} x - Friction amount for X component
     * @param {number} y - Friction amount for Y component
     */
    friction(x, y) {
        this.coords[0].value -= x;
        this.coords[1].value -= y;
    }

    /**
     * Applies a force to add to velocity.
     * @param {number} x - Force for X component
     * @param {number} y - Force for Y component
     */
    applyForce(x, y) {
        this.coords[0].value += x;
        this.coords[1].value += y;
    }

    /**
     * Calculates and returns the current angle from Cartesian coordinates.
     * @returns {number} Angle in radians
     */
    toAngle() {
        this._angle.value = Math.atan2(this.coords[1].value, this.coords[0].value);
        return this._angle.value;
    }

    /**
     * Calculates and returns the current speed (magnitude) from Cartesian coordinates.
     * @returns {number} Speed (magnitude of velocity vector)
     */
    toSpeed() {
        this.speed = Math.sqrt(Math.pow(this.coords[0].value, 2) + Math.pow(this.coords[1].value, 2));
        return this.speed;
    }

    /**
     * Converts current Cartesian coordinates to polar representation.
     * @returns {{velocity: number, angle: number}} Polar coordinates
     */
    toPolor() {
        const velocity = Math.sqrt(Math.pow(this.coords[0].value, 2) + Math.pow(this.coords[1].value, 2));
        const angle = Math.atan2(this.coords[1].value, this.coords[0].value);
        return { velocity, angle };
    }
}

export default Velocity;