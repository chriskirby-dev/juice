const { min, max, pow, sqrt, atan2 } = Math;

export const EPSILON = 2.220446049250313e-16;
export const PI = Math.PI;
export const distance = (x1, y1, x2, y2) => sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));
export const angle = (x1, y1, x2, y2) => atan2(y2 - y1, x2 - x1);
//lerp: a: startValue, b: endValue, t: percent complete
export const lerp = (a, b, t) => (1 - t) * a + t * b;
export const clamp = (n, _min, _max) => min(max(n, _min), _max);
//
export const normalize = (n, _min, _max) => (n - _min) / (_max - _min);

export function radians(degrees) {
    return degrees * (Math.PI / 180);
}

export function diff(a, b) {
    return a - b;
}

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
