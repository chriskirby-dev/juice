import { Vector2D, Vector3D } from "./Vector.mjs";

export class Position2D extends Vector2D {
    constructor(x = 0, y = 0) {
        super(x, y);
    }
}

export const Position = Position2D;

export class Position3D extends Vector3D {
    constructor(x = 0, y = 0, z = 0) {
        super(x, y, z);
    }
}

export default {
    Position3D,
    Position2D,
    Position,
};
