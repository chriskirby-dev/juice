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

export function parseAnchor(string) {
    const [ax, ay] = string.split(" ");
    const x = parseAnchorPosition(ax);
    const y = parseAnchorPosition(ay);
    return { x, y };
}
