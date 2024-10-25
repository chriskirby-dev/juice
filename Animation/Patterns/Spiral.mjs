class SpiralAnimation {
    constructor(centerX, centerY, initialRadius, angleIncrement = 0.05, spiralRadiusIncrement = 0.1) {
        this.centerX = centerX; // Center X position for the spiral
        this.centerY = centerY; // Center Y position for the spiral
        this.initialRadius = initialRadius; // Initial radius of the spiral
        this.angleIncrement = angleIncrement; // Angle increment (angular speed)
        this.spiralRadiusIncrement = spiralRadiusIncrement; // Radius increment over time (spiral growth)

        this.startTime = null; // Timestamp to track time-based changes
    }

    // Method to start or reset the animation time
    start() {
        this.startTime = performance.now();
    }

    // Method to compute the current position based on time for a spiral
    getSpiralPosition(currentTime) {
        if (!this.startTime) return null;

        const elapsedTime = (currentTime - this.startTime) / 1000; // Elapsed time in seconds
        const angle = elapsedTime * this.angleIncrement;
        const radius = this.initialRadius + elapsedTime * this.spiralRadiusIncrement;

        const x = this.centerX + radius * Math.cos(angle);
        const y = this.centerY + radius * Math.sin(angle);

        return { x, y, angle, radius };
    }

    // Method to update the angle increment (controls angular speed)
    updateAngleIncrement(newAngleIncrement) {
        this.angleIncrement = newAngleIncrement;
    }

    // Method to update the radius increment for the spiral
    updateSpiralRadiusIncrement(newSpiralRadiusIncrement) {
        this.spiralRadiusIncrement = newSpiralRadiusIncrement;
    }

    // Method to update the initial radius
    updateRadius(newRadius) {
        this.initialRadius = newRadius;
    }
}

export default SpiralAnimation;
