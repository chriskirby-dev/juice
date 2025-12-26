/**
 * Math utility module providing common mathematical operations and functions.
 * @module Math
 */

/**
 * Clamps a number between a minimum and maximum value.
 * @param {number} n - The number to clamp
 * @param {number} _min - The minimum value
 * @param {number} _max - The maximum value
 * @returns {number} The clamped value
 * @example
 * clamp(5, 0, 10) // returns 5
 * clamp(15, 0, 10) // returns 10
 * clamp(-5, 0, 10) // returns 0
 */
export function clamp(n, _min, _max) {
    return Math.min(Math.max(n, _min), _max);
}

/**
 * Creates a clamping function with fixed min and max values.
 * @param {number} _min - The minimum value
 * @param {number} _max - The maximum value
 * @returns {Function} A function that clamps values to the specified range
 * @example
 * const clamp0to10 = fixedClamp(0, 10);
 * clamp0to10(15) // returns 10
 */
export function fixedClamp(_min, _max) {
    return (value) => {
        return Math.min(Math.max(value, _min), _max);
    };
}

/**
 * Linear interpolation between two numbers.
 * @param {number} n1 - The start value
 * @param {number} n2 - The end value
 * @param {number} t - The interpolation factor (0-1)
 * @returns {number} The interpolated value
 * @example
 * lerp(0, 10, 0.5) // returns 5
 */
export function lerp(n1, n2, t) {
    return n1 + (n2 - n1) * t;
}

/**
 * Calculates the absolute difference between two numbers.
 * @param {number} a - The first number
 * @param {number} b - The second number
 * @returns {number} The absolute difference
 * @example
 * diff(10, 5) // returns 5
 * diff(5, 10) // returns 5
 */
export function diff(a, b) {
    return Math.abs(a - b);
}

/**
 * Normalizes a number to a 0-1 range based on min and max values.
 * @param {number} n - The number to normalize
 * @param {number} min - The minimum value of the range
 * @param {number} max - The maximum value of the range
 * @returns {number} The normalized value (0-1)
 * @example
 * norm(5, 0, 10) // returns 0.5
 */
export function norm(n, min, max) {
    return (n - min) / (max - min);
}

/**
 * Generates a random number between 0 and max.
 * @param {number} max - The maximum value
 * @returns {number} A random number between 0 and max
 */
export function random(max) {
    return Math.random() * max;
}

/**
 * Generates a random number between min and max (inclusive).
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} A random number between min and max
 */
export function randomBetween(min, max) {
    const rand = Math.random() * (max - min);
    return min + rand;
}

/**
 * Generates a random integer between min and max, optionally excluding certain values.
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @param {Array<number>} [exclude=[]] - Array of values to exclude
 * @returns {number} A random integer between min and max
 */
export function randomIntBetween(min, max, exclude = []) {
    let rand = Math.random() * (max - min);
    while (exclude.includes(rand) && max - min < exclude.length) {
        rand = Math.random() * (max - min);
    }
    return Math.round(min + rand);
}

/**
 * Generates a random integer between 0 and max.
 * @param {number} max - The maximum value
 * @returns {number} A random integer between 0 and max
 */
export function randomInt(max) {
    return Math.round(Math.random() * max);
}

/**
 * Rounds a number to the nearest integer.
 * @param {number} n - The number to round
 * @returns {number} The rounded number
 */
export function round(n) {
    return Math.round(n);
}

/**
 * Rounds a number down to the nearest integer.
 * @param {number} n - The number to floor
 * @returns {number} The floored number
 */
export function floor(n) {
    return Math.floor(n);
}

/**
 * Checks if a value is between min and max (inclusive).
 * @param {number} value - The value to check
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {boolean} True if value is between min and max
 * @example
 * between(5, 0, 10) // returns true
 * between(15, 0, 10) // returns false
 */
export function between(value, min, max) {
    return value >= min && value <= max;
}

/**
 * Common Math functions exported from the built-in Math object.
 * @type {Object}
 */
export const { cos, sin, atan, atan2, PI, abs, sqrt, min, max, pow } = Math;

/**
 * Math utility object with common mathematical functions.
 * @namespace MathUtil
 */
export default {
    clamp,
    lerp,
    diff,
    norm,
    random,
    randomInt,
    cos,
    sin,
    atan,
    atan2,
    PI,
    abs,
    sqrt,
    min,
    max,
    pow,
};