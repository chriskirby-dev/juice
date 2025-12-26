import { Vector3D } from "./Properties/Vector.mjs";
import AnimationValue from "./Properties/Value.mjs";

export class Position extends Vector3D {}

export class PhysicsValue {
    constructor(value, options = {}) {
        this.value = value;
        this.velocity = options.velocity || 0;
        this.friction = options.friction || 0;
        this.acceleration = options.acceleration || 0;
        this.maxVelocity = options.maxVelocity || Infinity;
    }

    // Method to update the physics value over time
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