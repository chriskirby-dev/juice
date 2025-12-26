export function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

// Method to convert degrees to radians
export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

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

export function middlePoint(x1, y1, x2, y2) {
    return {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2,
    };
}