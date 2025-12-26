/**
 * Geometry utility module providing mathematical functions for 2D geometry.
 * Includes distance calculation, angle determination, and interpolation functions.
 * @module Geometry
 */

const { min, max, pow, sqrt, atan2 } = Math;

/**
 * Machine epsilon for floating point comparisons.
 * @type {number}
 */
export const EPSILON = 2.220446049250313e-16;

/**
 * Value of Pi.
 * @type {number}
 */
export const PI = Math.PI;

/**
 * Calculates the Euclidean distance between two points.
 * @param {number} x1 - X coordinate of first point
 * @param {number} y1 - Y coordinate of first point
 * @param {number} x2 - X coordinate of second point
 * @param {number} y2 - Y coordinate of second point
 * @returns {number} The distance between the points
 * @example
 * distance(0, 0, 3, 4) // returns 5
 */
export const distance = (x1, y1, x2, y2) => sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));

/**
 * Calculates the angle from one point to another in radians.
 * @param {number} x1 - X coordinate of first point
 * @param {number} y1 - Y coordinate of first point
 * @param {number} x2 - X coordinate of second point
 * @param {number} y2 - Y coordinate of second point
 * @returns {number} The angle in radians
 * @example
 * angle(0, 0, 1, 1) // returns Math.PI / 4 (45 degrees)
 */
export const angle = (x1, y1, x2, y2) => atan2(y2 - y1, x2 - x1);

/**
 * Linear interpolation between two values.
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0 to 1, where 0 returns a and 1 returns b)
 * @returns {number} The interpolated value
 * @example
 * lerp(0, 10, 0.5) // returns 5
 */
export const lerp = (a, b, t) => (1 - t) * a + t * b;

/**
 * Clamps a number between a minimum and maximum value.
 * @param {number} n - The number to clamp
 * @param {number} _min - The minimum value
 * @param {number} _max - The maximum value
 * @returns {number} The clamped value
 * @example
 * clamp(15, 0, 10) // returns 10
 */
export const clamp = (n, _min, _max) => min(max(n, _min), _max);

/**
 * Normalizes a number to a 0-1 range based on min and max values.
 * @param {number} n - The number to normalize
 * @param {number} _min - The minimum value of the range
 * @param {number} _max - The maximum value of the range
 * @returns {number} The normalized value (0-1)
 * @example
 * normalize(5, 0, 10) // returns 0.5
 */
export const normalize = (n, _min, _max) => (n - _min) / (_max - _min);

/**
 * Converts degrees to radians.
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 * @example
 * radians(180) // returns Math.PI
 */
export function radians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Calculates the difference between two numbers.
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The difference (a - b)
 */
export function diff(a, b) {
    return a - b;
}

/**
 * Calculates the difference between two points across all axes.
 * @param {Object} p1 - First point (object with numeric properties for each axis)
 * @param {Object} p2 - Second point (object with numeric properties for each axis)
 * @returns {Object} Object with differences for each axis
 * @example
 * pointDiff({x: 5, y: 10}, {x: 2, y: 3}) // returns {x: 3, y: 7}
 */
export function pointDiff(p1, p2) {
    const diff = {};
    for (let axis in p1) {
        diff[axis] = p1[axis] - p2[axis];
    }
    return diff;
}

export default {
    EPSILON,
    PI,
    distance,
    angle,
    lerp,
    clamp,
    normalize,
    diff,
};