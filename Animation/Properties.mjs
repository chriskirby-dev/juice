/**
 * Animation properties module exporting common property types.
 * Re-exports Position and provides PhysicsValue for physics-based animations.
 * @module Animation/Properties
 */

import { Vector3D } from "./Properties/Vector.mjs";
import AnimationValue from "./Properties/Value.mjs";

/**
 * 3D position alias using Vector3D.
 * @class Position
 * @extends Vector3D
 */
export class Position extends Vector3D {}

/**
 * Physics-enabled animation value with velocity, acceleration, and friction.
 * @class PhysicsValue
 * @param {number} value - Initial value
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.velocity=0] - Initial velocity
 * @param {number} [options.friction=0] - Friction coefficient (0-1)
 * @param {number} [options.acceleration=0] - Acceleration per frame
 * @param {number} [options.maxVelocity=Infinity] - Maximum velocity limit
 * @example
 * const physics = new PhysicsValue(100, {
 *   velocity: 5,
 *   friction: 0.1,
 *   acceleration: 0.5,
 *   maxVelocity: 20
 * });
 * physics.update(0.016); // Update with delta time
 */
export class PhysicsValue {
    constructor(value, options = {}) {
        this.value = value;
        this.velocity = options.velocity || 0;
        this.friction = options.friction || 0;
        this.acceleration = options.acceleration || 0;
        this.maxVelocity = options.maxVelocity || Infinity;
    }

    /**
     * Updates value based on physics simulation over time.
     * Applies acceleration, friction, and velocity limits.
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        // Apply acceleration to the velocity
        this.velocity += this.acceleration * deltaTime;

        // Apply friction to the velocity
        if (this.friction !== 0) {
            this.velocity *= 1 - this.friction;
        }

        // Limit the velocity to maxVel
        this.velocity = Math.max(Math.min(this.velocity, this.maxVelocity), -this.maxVelocity);

        // Update the value based on the velocity
        this.value += this.velocity * deltaTime;
    }
}