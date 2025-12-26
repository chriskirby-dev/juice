/**
 * Animation utilities for mathematical operations, conversions, and calculations.
 * Provides constants, distance calculations, angle conversions, and interpolation functions.
 * @module Animation/Util
 */

const { abs, acos, asin, atan, atan2, ceil, cos, max, min, PI, pow, random, round, sin, sqrt, tan } = Math;

/**
 * Utility functions for animation mathematics and calculations.
 * @class AnimationUtil
 */
class AnimationUtil {
    /** @type {number} Pi constant */
    static PI = Math.PI;
    /** @type {number} Half pi (π/2) */
    static HALF_PI = 0.5 * Math.PI;
    /** @type {number} Quarter pi (π/4) */
    static QUART_PI = 0.25 * Math.PI;
    /** @type {number} Tau (2π) */
    static TAU = 2 * Math.PI;
    /** @type {number} Degrees to radians multiplier */
    static TO_RAD = Math.PI / 180;
    /** @type {number} Gravitational constant */
    static G = 6.67 * pow(10, -11);
    /** @type {number} Machine epsilon */
    static EPSILON = 2.220446049250313e-16;

    /**
     * Calculates distance between two points in 2D or 3D space.
     * @param {Object} point1 - First point with x, y, [z] properties
     * @param {Object} point2 - Second point with x, y, [z] properties
     * @returns {number} Distance between points
     * @static
     */
    static pointDistance(point1, point2) {
        let deltas = [];
        deltas = [point1.x - point2.x, point1.y - point2.y];
        if (point1.z !== undefined) deltas.push(point1.z - point2.z);

        return Math.hypot(...deltas);
    }

    /**
     * Converts milliseconds to seconds.
     * @param {number} ms - Milliseconds
     * @returns {number} Seconds
     * @static
     */
    static toSeconds(ms) {
        return ms / 1000;
    }

    /**
     * Calculates difference between two values.
     * @param {number} a - First value
     * @param {number} b - Second value
     * @returns {number} Difference
     * @static
     */
    static diff(a, b) {
        return a - b;
    }

    /**
     * Calculates delta time in milliseconds.
     * @param {number} last - Last timestamp
     * @param {number} now - Current timestamp
     * @returns {number} Delta in milliseconds
     * @static
     */
    static deltaMS(last, now) {
        return now - last;
    }

    /**
     * Calculates delta time in seconds.
     * @param {number} last - Last timestamp
     * @param {number} now - Current timestamp
     * @returns {number} Delta in seconds
     * @static
     */
    static delta(last, now) {
        return (now - last) / 1000;
    }

    /**
     * Calculates frames per second from delta.
     * @param {number} delta - Delta time in seconds
     * @returns {number} FPS
     * @static
     */
    static FPS(delta) {
        return 1 / delta;
    }

    /**
     * Converts degrees to radians.
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     * @static
     */
    static degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Calculates distance between two 2D points.
     * @type {Function}
     * @static
     */
    static dist = (x1, y1, x2, y2) => sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));
    
    /**
     * Calculates angle between two 2D points.
     * @type {Function}
     * @static
     */
    static angle = (x1, y1, x2, y2) => atan2(y2 - y1, x2 - x1);
    
    /**
     * Linear interpolation between two values.
     * @type {Function}
     * @static
     */
    static lerp = (a, b, t) => (1 - t) * a + t * b;
    
    /**
     * Clamps value between min and max.
     * @type {Function}
     * @static
     */
    static clamp = (n, _min, _max) => min(max(n, _min), _max);
    
    /**
     * Normalizes value to 0-1 range based on min and max.
     * @type {Function}
     * @static
     */
    static norm = (n, _min, _max) => (n - _min) / (_max - _min);
}

export default AnimationUtil;