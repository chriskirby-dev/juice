/**
 * Angle conversion and circle geometry utilities.
 * Provides functions for converting between degrees and radians, and calculating circle tangent angles.
 * @module Animation/Angles
 */

/**
 * Converts radians to degrees.
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 * @example
 * radiansToDegrees(Math.PI); // 180
 */
export function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Converts degrees to radians.
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 * @example
 * degreesToRadians(180); // Math.PI
 */
export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Calculates the entry point and tangent angle for a circle at a given degree.
 * @param {number} centerX - Circle center X coordinate
 * @param {number} centerY - Circle center Y coordinate
 * @param {number} radius - Circle radius
 * @param {number} degreeAngle - Entry angle in degrees
 * @param {boolean} [clockwise=true] - Direction of motion
 * @param {boolean} [inDegrees=true] - Return angle in degrees (false for radians)
 * @returns {{x: number, y: number, angle: number}} Entry point and tangent angle
 * @example
 * const entry = circleEntryAngle(100, 100, 50, 45, true);
 * // Returns { x: 135.36, y: 135.36, angle: -45 }
 */
export function circleEntryAngle(centerX, centerY, radius, degreeAngle, clockwise = true, inDegrees = true) {
    // Convert degreeAngle to radians
    const radianAngle = this.degreesToRadians(degreeAngle);

    // Compute the point on the circumference using the radius and degree angle
    const x = centerX + radius * Math.cos(radianAngle);
    const y = centerY + radius * Math.sin(radianAngle);

    // Tangential angle is perpendicular to the radius
    // Clockwise tangential: -90°, Counterclockwise tangential: +90°
    let tangentAngleRadians = clockwise
        ? radianAngle - Math.PI / 2 // For clockwise motion, subtract 90 degrees (π/2 radians)
        : radianAngle + Math.PI / 2; // For counterclockwise motion, add 90 degrees (π/2 radians)

    // Ensure the angle is within 0 and 2π radians
    tangentAngleRadians = (tangentAngleRadians + 2 * Math.PI) % (2 * Math.PI);

    // Return in degrees if requested, otherwise in radians
    return {
        x,
        y,
        angle: inDegrees ? this.radiansToDegrees(tangentAngleRadians) : tangentAngleRadians,
    };
}

/**
 * Calculates the middle point between two 2D coordinates.
 * @param {number} x1 - First point X coordinate
 * @param {number} y1 - First point Y coordinate
 * @param {number} x2 - Second point X coordinate
 * @param {number} y2 - Second point Y coordinate
 * @returns {{x: number, y: number}} Middle point coordinates
 * @example
 * middlePoint(0, 0, 10, 10); // { x: 5, y: 5 }
 */
export function middlePoint(x1, y1, x2, y2) {
    return {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2,
    };
}