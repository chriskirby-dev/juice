export function clamp(n, _min, _max) {
    return Math.min(Math.max(n, _min), _max);
}

export function fixedClamp(_min, _max) {
    return (value) => {
        return Math.min(Math.max(value, _min), _max);
    };
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

export function randomBetween(min, max) {
    const rand = Math.random() * (max - min);
    return min + rand;
}

export function randomIntBetween(min, max, exclude = []) {
    let rand = Math.random() * (max - min);
    while (exclude.includes(rand) && max - min < exclude.length) {
        rand = Math.random() * (max - min);
    }
    return Math.round(min + rand);
}

export function randomInt(max) {
    return Math.round(Math.random() * max);
}

export function round(n) {
    return Math.round(n);
}

export function floor(n) {
    return Math.floor(n);
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
