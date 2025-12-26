/**
 * Anchor parsing utilities for converting position strings to numeric values.
 * Handles named positions (top, bottom, left, right, center) and percentages.
 * @module Animation/Anchor
 */

/**
 * Parses anchor position string to numeric value (0-1 range).
 * @param {string|number} position - Position name or percentage string or numeric value
 * @returns {number} Numeric position (0 = top/left, 0.5 = center, 1 = bottom/right)
 * @example
 * parseAnchorPosition('top'); // 0
 * parseAnchorPosition('center'); // 0.5
 * parseAnchorPosition('75%'); // 0.75
 */
export function parseAnchorPosition(position) {
    switch (position) {
        case "top":
            return 0;
            break;
        case "bottom":
            return 1;
            break;
        case "left":
            return 0;
            break;
        case "right":
            return 1;
            break;
        case "center":
            return 0.5;
            break;
        default:
            return position.includes("%") ? parseFloat(position) / 100 : position;
    }
}

/**
 * Parses anchor string with x and y positions into numeric coordinates.
 * @param {string} string - Anchor position string (e.g., "top left", "center center")
 * @returns {{x: number, y: number}} Anchor coordinates as object
 * @example
 * parseAnchor('top left'); // { x: 0, y: 0 }
 * parseAnchor('center center'); // { x: 0.5, y: 0.5 }
 * parseAnchor('bottom right'); // { x: 1, y: 1 }
 */
export function parseAnchor(string) {
    const [ax, ay] = string.split(" ");
    const x = parseAnchorPosition(ax);
    const y = parseAnchorPosition(ay);
    return { x, y };
}