import DistinctArray from "../../DataTypes/DistinctArray.mjs";

export class Vector2D {
    constructor(x = 0, y = 0) {
        this.data = new Float32Array(2);
        this.data[0] = x;
        this.data[1] = y;
        this.dirtyProperties = new DistinctArray();

        Object.defineProperty(this, "0", {
            get: () => this.data[0],
            set: (value) => {
                if (this.data[0] === value) return;
                this.data[0] = value;
                this.dirtyProperties.push(0, "x"); // Mark as dirty on modification
            }
        });

        Object.defineProperty(this, "1", {
            get: () => this.data[1],
            set: (value) => {
                if (this.data[1] === value) return;
                this.data[1] = value;
                this.dirtyProperties.push(1, "y"); // Mark as dirty on modification
            }
        });
    }

    get dirty() {
        return this.dirtyProperties.length > 0;
    }

    get x() {
        return this.data[0];
    }

    set x(value) {
        this.data[0] = value;
        this.dirtyProperties.push("x", 0); // Mark as dirty
    }

    get y() {
        return this.data[1];
    }

    set y(value) {
        this.data[1] = value;
        this.dirtyProperties.push("y", 1); // Mark as dirty
    }

    set(x, y) {
        this.data[0] = x;
        this.data[1] = y;
        this.dirty = true;
        return this;
    }

    add(v) {
        this.data[0] += v.data[0];
        this.data[1] += v.data[1];
        this.dirty = true;
        return this;
    }

    subtract(v) {
        this.data[0] -= v.data[0];
        this.data[1] -= v.data[1];
        this.dirty = true;
        return this;
    }

    multiply(scalar) {
        this.data[0] *= scalar;
        this.data[1] *= scalar;
        this.dirty = true;
        return this;
    }

    dot(v) {
        return this.data[0] * v.data[0] + this.data[1] * v.data[1];
    }

    length() {
        return Math.hypot(this.data[0], this.data[1]);
    }

    normalize() {
        let len = this.length();
        if (len > 0) this.multiply(1 / len);
        this.dirty = true;
        return this;
    }

    clone() {
        return new Vector2(this.data[0], this.data[1]);
    }

    // Method to manually reset dirty flag
    clean() {
        this.dirty = false;
    }

    isDirty() {
        return this.dirtyProperties.length > 0;
    }

    toArray() {
        return [this.data[0], this.data[1]];
    }
}
export class Vector3D {
    /**
     * Initializes a new instance of the Vector3D class.
     * @param {number} [x=0] - The x value.
     * @param {number} [y=0] - The y value.
     * @param {number} [z=0] - The z value.
     */
    constructor(x = 0, y = 0, z = 0) {
        this.data = new Float32Array(3);
        this.data[0] = x;
        this.data[1] = y;
        this.data[2] = z;
        this.dirtyProperties = new DistinctArray();
        Object.defineProperty(this, "0", {
            get: () => this.data[0],
            set: (value) => {
                if (this.frozen) return;
                this.data[0] = value;
                this.dirtyProperties.push(0, "x"); // Mark as dirty on modification
            }
        });

        Object.defineProperty(this, "1", {
            get: () => this.data[1],
            set: (value) => {
                if (this.frozen) return;
                this.data[1] = value;
                this.dirtyProperties.push(1, "y"); // Mark as dirty on modification
            }
        });

        Object.defineProperty(this, "2", {
            get: () => this.data[2],
            set: (value) => {
                if (this.frozen) return;
                this.data[2] = value;
                this.dirtyProperties.push(2, "z"); // Mark as dirty on modification
            }
        });
    }

    /**
     * Gets the x coordinate of the vector.
     * @return {number} The x coordinate of the vector.
     */
    get x() {
        return this.data[0];
    }

    /**
     * Sets the x coordinate of the vector.
     * @param {number} value - The x coordinate.
     */
    set x(value) {
        if (this.frozen) return;
        this.data[0] = value;
        this.dirtyProperties.push("x", 0); // Mark as dirty
    }

    /**
     * Gets the y coordinate of the vector.
     * @returns {number} - The y coordinate.
     */
    get y() {
        return this.data[1];
    }
    /**
     * Sets the y coordinate of the vector.
     * @param {number} value - The y coordinate.
     */

    set y(value) {
        if (this.frozen) return;
        this.data[1] = value;
        this.dirtyProperties.push("y", 1); // Mark as dirty
    }

    /**
     * Gets the z coordinate of the vector.
     * @returns {number} - The z coordinate.
     */
    get z() {
        return this.data[2];
    }

    /**
     * Sets the z coordinate of the vector.
     * @param {number} value - The z coordinate.
     * @returns {Vector3D} - The modified vector.
     */
    set z(value) {
        if (this.frozen) return;
        this.data[2] = value;
        this.dirtyProperties.push("z", 2); // Mark as dirty
    }

    /**
     * Sets the x, y, and z coordinates of the vector.
     * @param {number} x - The x coordinate.
     * @param {number} y - The y coordinate.
     * @param {number} z - The z coordinate.
     * @returns {Vector3D} - The modified vector.
     */
    set(x, y, z) {
        if (this.frozen) return;
        this.data[0] = x;
        this.data[1] = y;
        this.data[2] = z;
        this.dirty = true;
        return this;
    }

    /**
     * Adds a given vector to the current vector.
     * @param {Vector3D} v - The vector to add to the current vector.
     * @returns {Vector3D} - The resulting vector.
     */
    add(v) {
        if (this.frozen) return;
        this.data[0] += v.data[0];
        this.data[1] += v.data[1];
        this.data[2] += v.data[2];
        this.dirty = true;
        return this;
    }

    /**
     * Subtracts a given vector from the current vector.
     * @param {Vector3D} v - The vector to subtract from the current vector.
     * @returns {Vector3D} - The resulting vector.
     */
    subtract(v) {
        if (this.frozen) return;
        this.data[0] -= v.data[0];
        this.data[1] -= v.data[1];
        this.data[2] -= v.data[2];
        this.dirty = true;
        return this;
    }

    /**
     * Multiplies the vector by a scalar value.
     * @param {number} scalar - The value to multiply the vector by.
     * @returns {Vector3D} - The resulting vector.
     */
    multiply(scalar) {
        if (this.frozen) return;
        this.data[0] *= scalar;
        this.data[1] *= scalar;
        this.data[2] *= scalar;
        this.dirty = true;
        return this;
    }

    /**
     * Calculates the dot product of two vectors.
     * @param {Vector3D} v - The vector to calculate the dot product with.
     * @returns {number} - The resulting dot product.
     */
    dot(v) {
        return this.data[0] * v.data[0] + this.data[1] * v.data[1] + this.data[2] * v.data[2];
    }

    /**
     * Calculates the cross product of two vectors.
     * @param {Vector3D} v - The vector to calculate the cross product with.
     * @returns {Vector3D} - The resulting vector.
     */
    cross(v) {
        const x = this.data[0],
            y = this.data[1],
            z = this.data[2];
        this.data[0] = y * v.data[2] - z * v.data[1];
        this.data[1] = z * v.data[0] - x * v.data[2];
        this.data[2] = x * v.data[1] - y * v.data[0];
        this.dirty = true;
        return this;
    }

    /**
     * Calculates the length of the vector.
     * @returns {number} - The length of the vector.
     */
    length() {
        return Math.hypot(this.data[0], this.data[1], this.data[2]);
    }

    /**
     * Normalizes the vector, effectively scaling it to have a length of 1.
     * Does not modify the vector if its length is 0.
     * @returns {Vector3D} - The normalized vector.
     */
    normalize() {
        let len = this.length();
        if (len > 0) this.multiply(1 / len);
        this.dirty = true;
        return this;
    }

    /**
     * Creates a copy of the vector.
     * @returns {Vector3D} - The cloned vector.
     */
    clone() {
        return new Vector3(this.data[0], this.data[1], this.data[2]);
    }

    freeze(freeze = true) {
        this.frozen = freeze;
    }

    freezeAt(x, y, z) {
        this.freeze(false);
        this.set(x, y, z);
        this.freeze();
    }

    /**
     * Resets the dirty flag for all properties.
     */
    clean() {
        this.dirtyProperties = new DistinctArray();
    }

    get dirty() {
        return this.dirtyProperties.length > 0;
    }

    /**
     * Checks if the vector has changed since the last time it was validated.
     * If property is provided, it checks if the specific property has changed.
     * If property is a string with length greater than 1, it splits the string into an array of properties and checks if any of them have changed.
     * @param {string|[string]} property - Optional. The property or properties to check for changes.
     * @returns {boolean} - True if the vector or any of its properties have changed, false otherwise.
     */
    isDirty(property) {
        let props = [property];
        if (property.length > 1) props = property.split("");
        return this.dirtyProperties.length > 0;
    }

    /**
     * Returns an array representation of the vector.
     * @returns {Array<number>} - The array representation of the vector.
     */
    toArray() {
        return [this.data[0], this.data[1], this.data[2]];
    }
}

export class Vector4D {
    constructor(x = 0, y = 0, z = 0, w = 0) {
        this.data = new Float32Array(4);
        this.data[0] = x;
        this.data[1] = y;
        this.data[2] = z;
        this.data[3] = w;
        this.dirtyProperties = new DistinctArray();
        Object.defineProperty(this, "0", {
            get: () => this.data[0],
            set: (value) => {
                this.data[0] = value;
                this.dirtyProperties.push(0, "x"); // Mark as dirty on modification
            }
        });

        Object.defineProperty(this, "1", {
            get: () => this.data[1],
            set: (value) => {
                this.data[1] = value;
                this.dirtyProperties.push(1, "y"); // Mark as dirty on modification
            }
        });

        Object.defineProperty(this, "2", {
            get: () => this.data[2],
            set: (value) => {
                this.data[2] = value;
                this.dirtyProperties.push(2, "z"); // Mark as dirty on modification
            }
        });

        Object.defineProperty(this, "3", {
            get: () => this.data[3],
            set: (value) => {
                this.data[3] = value;
                this.dirtyProperties.push(3, "w"); // Mark as dirty on modification
            }
        });
    }

    get x() {
        return this.data[0];
    }

    set x(value) {
        this.data[0] = value;
        this.dirtyProperties.push(0, "x");
    }

    get y() {
        return this.data[1];
    }

    set y(value) {
        this.data[1] = value;
        this.dirtyProperties.push(1, "y");
    }

    get z() {
        return this.data[2];
    }

    set z(value) {
        this.data[2] = value;
        this.dirtyProperties.push(2, "z");
    }

    get w() {
        return this.data[3];
    }

    set w(value) {
        this.data[3] = value;
        this.dirtyProperties.push(3, "w");
    }

    set(x, y, z, w) {
        this.data[0] = x;
        this.data[1] = y;
        this.data[2] = z;
        this.data[3] = w;
        this.dirty = true;
        return this;
    }

    add(v) {
        this.data[0] += v.data[0];
        this.data[1] += v.data[1];
        this.data[2] += v.data[2];
        this.data[3] += v.data[3];
        this.dirty = true;
        return this;
    }

    subtract(v) {
        this.data[0] -= v.data[0];
        this.data[1] -= v.data[1];
        this.data[2] -= v.data[2];
        this.data[3] -= v.data[3];
        this.dirty = true;
        return this;
    }

    multiply(scalar) {
        this.data[0] *= scalar;
        this.data[1] *= scalar;
        this.data[2] *= scalar;
        this.data[3] *= scalar;
        this.dirty = true;
        return this;
    }

    dot(v) {
        return (
            this.data[0] * v.data[0] + this.data[1] * v.data[1] + this.data[2] * v.data[2] + this.data[3] * v.data[3]
        );
    }

    length() {
        return Math.hypot(this.data[0], this.data[1], this.data[2], this.data[3]);
    }

    normalize() {
        let len = this.length();
        if (len > 0) this.multiply(1 / len);
        this.dirty = true;
        return this;
    }

    clone() {
        return new Vector4(this.data[0], this.data[1], this.data[2], this.data[3]);
    }

    clean() {
        this.dirtyProperties = new DistinctArray();
    }

    get dirty() {
        return this.dirtyProperties.length > 0;
    }

    isDirty(properties) {
        if (typeof properties == "string" && properties.length > 1) properties = properties.split("");

        if (properties) {
            for (let i = 0; i < properties.length; i++) {
                if (this.dirtyProperties.indexOf(properties[i]) > -1) return true;
            }
        }
        return this.dirty;
    }

    toArray() {
        return [this.data[0], this.data[1], this.data[2], this.data[3]];
    }
}
