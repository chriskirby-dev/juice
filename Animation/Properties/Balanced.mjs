/**
 * BalancedProperty manages a property that auto-balances toward a center value.
 * Provides acceleration, deceleration, and velocity-based movement with directional control.
 * @module Animation/Properties/Balanced
 */

/**
 * Represents a property that automatically balances toward a center value.
 * Useful for smooth, physics-based animations with acceleration and deceleration.
 * @class BalancedProperty
 * @param {number} range - Maximum distance from center
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.value=0] - Initial value
 * @param {number} [options.center=0] - Center point to balance toward
 * @param {number} [options.maxSpeed=1] - Maximum velocity
 * @param {number} [options.speed=0] - Initial velocity
 * @param {number} [options.acceleration=0.01] - Acceleration rate
 * @param {number} [options.deceleration=0.01] - Deceleration rate
 * @example
 * const prop = new BalancedProperty(100, {center: 0, maxSpeed: 2});
 * prop.direction(1); // Move in positive direction
 * prop.update(0.016); // Update with delta time
 */
class BalancedProperty {
    /** @type {boolean} Whether animation is enabled */
    animate = true;
    /** @type {number} Current movement direction (-1, 0, 1) */
    _direction = 0;
    
    /**
     * Creates a new BalancedProperty instance.
     * @param {number} range - Maximum distance from center
     * @param {Object} [options={}] - Configuration options
     */
    constructor(range, options = {}) {
        this.range = range;
        this.value = options.value || 0;
        this.center = options.center || 0;
        this.maxSpeed = options.maxSpeed || 1;
        this.velocity = options.speed || 0;
        this.acceleration = options.acceleration || 0.01;
        this.deceleration = options.deceleration || 0.01;
    }

    /**
     * Sets the movement direction.
     * @param {number} direction - Direction to move (-1 for negative, 0 for center, 1 for positive)
     */
    direction(direction) {
        this._direction = direction;
        console.log("Direction", this._direction);
    }

    /**
     * Updates the value of the property over time
     * @param {number} delta - The time elapsed since the last frame
     */
    update(delta) {
        // Calculate the sign of the difference between the value and the center
        const sign = Math.sign(this.value - this.center);

        const correcting = this._direction !== sign;

        // Calculate the acceleration based on the direction and whether the value is increasing or decreasing
        const acc = this._direction !== 0 ? this.acceleration : this.deceleration;

        // Update the velocity based on the acceleration and the current velocity
        this.velocity += acc * (this._direction !== 0 ? this._direction : -sign);

        // Limit the velocity to the maximum speed
        this.velocity = Math.min(this.maxSpeed, Math.max(-this.maxSpeed, this.velocity));

        // Update the value based on the velocity and the current value
        this.value += this.velocity * delta;

        if (this._direction === 0 && Math.sign(this.value) !== sign) {
            this.velocity = 0;
            this.value = 0;
        }

        // Limit the value to the range
        this.value = Math.min(this.range, Math.max(-this.range, this.value));

        // Debugging information
        //  console.log("Direction", this._direction, "Speed", this.velocity.toFixed(4), "Value", this.value.toFixed(4));
    }
}

export default BalancedProperty;