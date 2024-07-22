const { abs, acos, asin, atan, atan2, ceil, cos, max, min, PI, pow, random, round, sin, sqrt, tan } = Math;

class AnimationUtil {
    static PI = Math.PI;
    static HALF_PI = 0.5 * Math.PI;
    static QUART_PI = 0.25 * Math.PI;
    static TAU = 2 * Math.PI;
    static TO_RAD = Math.PI / 180;
    static G = 6.67 * pow(10, -11);
    static EPSILON = 2.220446049250313e-16;

    static pointDistance(point1, point2) {
        let deltas = [];
        deltas = [point1.x - point2.x, point1.y - point2.y];
        if (point1.z !== undefined) deltas.push(point1.z - point2.z);

        return Math.hypot(...deltas);
    }

    static toSeconds(ms) {
        return ms / 1000;
    }

    static diff(a, b) {
        return a - b;
    }

    static deltaMS(last, now) {
        return now - last;
    }

    static delta(last, now) {
        return (now - last) / 1000;
    }

    static FPS(delta) {
        return 1 / delta;
    }

    static degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    static dist = (x1, y1, x2, y2) => sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));
    static angle = (x1, y1, x2, y2) => atan2(y2 - y1, x2 - x1);
    static lerp = (a, b, t) => (1 - t) * a + t * b;
    static clamp = (n, _min, _max) => min(max(n, _min), _max);
    static norm = (n, _min, _max) => (n - _min) / (_max - _min);
}

export default AnimationUtil;
