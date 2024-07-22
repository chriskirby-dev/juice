export function clamp(n, _min, _max) {
    return Math.min(Math.max(n, _min), _max);
}

//Linear Interpolation
export function lerp(n1, n2, t) {
    return n1 + (n2 - n1) * t;
}

export function diff(a, b) {
    return Math.abs(a - b);
}

export function norm(n, min, max) {
    return (n - min) / (max - min);
}

export function random(max) {
    return Math.random() * max;
}

export function randomInt(max) {
    return Math.floor(Math.random() * max);
}

export const { cos, sin, atan, atan2, PI, abs, sqrt, min, max, pow } = Math;

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
