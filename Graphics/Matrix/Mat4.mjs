// A mat4 is a flat array with 16 elements
export const mat4 = {
    create: function () {
        // Returns an identity matrix
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    },
    identity: function (out) {
        // Resets a matrix to the identity matrix
        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = 1;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = 1;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
        return out;
    },
    multiply: function (out, a, b) {
        // Multiplies two mat4 matrices (a * b) and stores the result in out
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                out[i * 4 + j] =
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
        return out;
    },
    translate: function (out, a, v) {
        // Applies a translation by vector v to matrix a
        const x = v[0],
            y = v[1],
            z = v[2];
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        return out;
    },
    scale: function (out, a, v) {
        // Scales the matrix by vector v
        const x = v[0],
            y = v[1],
            z = v[2];
        out[0] = a[0] * x;
        out[1] = a[1] * x;
        out[2] = a[2] * x;
        out[3] = a[3] * x;
        out[4] = a[4] * y;
        out[5] = a[5] * y;
        out[6] = a[6] * y;
        out[7] = a[7] * y;
        out[8] = a[8] * z;
        out[9] = a[9] * z;
        out[10] = a[10] * z;
        out[11] = a[11] * z;
        return out;
    },
    perspective: function (out, fov, aspect, zNear, zFar) {
        const f = 1.0 / Math.tan(fov / 2); // Focal length based on FOV
        const rangeInv = 1.0 / (zNear - zFar);

        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;

        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;

        out[8] = 0;
        out[9] = 0;
        out[10] = (zFar + zNear) * rangeInv;
        out[11] = -1;

        out[12] = 0;
        out[13] = 0;
        out[14] = 2 * zFar * zNear * rangeInv;
        out[15] = 0;

        return out;
    },
    orthographic: function (out, left, right, bottom, top, zNear, zFar) {
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (zNear - zFar);

        out[0] = -2 * lr;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;

        out[4] = 0;
        out[5] = -2 * bt;
        out[6] = 0;
        out[7] = 0;

        out[8] = 0;
        out[9] = 0;
        out[10] = 2 * nf;
        out[11] = 0;

        out[12] = (left + right) * lr;
        out[13] = (top + bottom) * bt;
        out[14] = (zFar + zNear) * nf;
        out[15] = 1;

        return out;
    },
    isometric: function (out) {
        const sqrt3 = Math.sqrt(3);
        out[0] = sqrt3 / 2;
        out[1] = -1 / 2;
        out[2] = 0;
        out[3] = 0;

        out[4] = 0;
        out[5] = 1;
        out[6] = 0;
        out[7] = 0;

        out[8] = sqrt3 / 2;
        out[9] = 1 / 2;
        out[10] = 0;
        out[11] = 0;

        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;

        return out;
    },
    frustum: function (out, left, right, bottom, top, near, far) {
        const lr = 1 / (right - left);
        const bt = 1 / (top - bottom);
        const nf = 1 / (far - near);
        out[0] = 2 * near * lr;
        out[1] = 0;
        out[2] = 0; // 0
        out[3] = 0; // 0

        out[4] = 0;
        out[5] = 2 * near * bt;
        out[6] = 0; // 0       0
        out[7] = 0; // 0       0

        out[8] = (right + left) * lr;
        out[9] = (top + bottom) * bt;
        out[10] = (far + near) * nf;
        out[11] = -1;

        out[12] = 0;
        out[13] = 0;
        out[14] = 2 * far * near * nf;
        out[15] = 0;

        return out;
    },
};

export default mat4;
