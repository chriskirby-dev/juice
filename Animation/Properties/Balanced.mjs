class BalancedProperty {
    animate = true;
    _direction = 0;
    constructor(range, options = {}) {
        this.range = range;
        this.value = options.value || 0;
        this.center = options.center || 0;
        this.maxSpeed = options.maxSpeed || 1;
        this.velocity = options.speed || 0;
        this.acceleration = options.acceleration || 0.01;
        this.deceleration = options.deceleration || 0.01;
    }

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