/**
 * Core animation properties module that exports all essential animation value classes.
 * Provides centralized access to vectors, positions, rotations, and animated values.
 * @module Animation/Properties/Core
 */

import AnimationValue from "./Value.mjs";
import { default as Rotation, Rotation2D, Rotation3D } from "./Rotation.mjs";
import { Vector3D, Vector2D, Vector4D } from "./Vector.mjs";
import { Position, Position2D, Position3D } from "./Position.mjs";

export {
    AnimationValue,
    Rotation,
    Rotation2D,
    Rotation3D,
    Vector4D,
    Vector3D,
    Vector2D,
    Position,
    Position2D,
    Position3D,
};

export default {
    AnimationValue,
    Rotation,
    Vector4D,
    Vector3D,
    Vector2D,
    Position,
    Position2D,
    Position3D,
};