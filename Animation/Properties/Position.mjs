/**
 * Position classes for 2D and 3D spatial coordinates in animations.
 * Extends Vector classes to provide position-specific functionality.
 * @module Animation/Properties/Position
 */

import { Vector2D, Vector3D } from "./Vector.mjs";

/**
 * Represents a 2D position with x and y coordinates.
 * @class Position2D
 * @extends Vector2D
 * @param {number} [x=0] - X coordinate
 * @param {number} [y=0] - Y coordinate
 * @example
 * const pos = new Position2D(100, 200);
 */
export class Position2D extends Vector2D {
    constructor(x = 0, y = 0, options = { history: 3 }) {
        super(x, y, options);
    }
}

/**
 * Alias for Position2D as the default Position class.
 * @type {Position2D}
 */
export const Position = Position2D;

/**
 * Represents a 3D position with x, y, and z coordinates.
 * @class Position3D
 * @extends Vector3D
 * @param {number} [x=0] - X coordinate
 * @param {number} [y=0] - Y coordinate
 * @param {number} [z=0] - Z coordinate
 * @example
 * const pos = new Position3D(100, 200, 50);
 */
export class Position3D extends Vector3D {
    constructor(x = 0, y = 0, z = 0, options = { history: 3 }) {
        super(x, y, z, options);
    }
}

export default {
    Position3D,
    Position2D,
    Position
};
