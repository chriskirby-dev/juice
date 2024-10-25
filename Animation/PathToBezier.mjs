function pathDataToBezier(pathData) {
    let commands = pathData.match(/[a-zA-Z][^a-zA-Z]*/g);
    let currentPos = { x: 0, y: 0 };
    let startPoint = { x: 0, y: 0 };
    let bezierCurves = [];

    commands.forEach((command) => {
        let type = command[0];
        let values = command
            .slice(1)
            .trim()
            .split(/[\s,]+/)
            .map(Number);

        switch (type) {
            case "M": // Move to (absolute)
                currentPos = { x: values[0], y: values[1] };
                startPoint = { ...currentPos };
                break;
            case "m": // Move to (relative)
                currentPos = { x: currentPos.x + values[0], y: currentPos.y + values[1] };
                startPoint = { ...currentPos };
                break;
            case "L": // Line to (absolute)
                bezierCurves.push(convertLineToBezier(currentPos, { x: values[0], y: values[1] }));
                currentPos = { x: values[0], y: values[1] };
                break;
            case "l": // Line to (relative)
                bezierCurves.push(
                    convertLineToBezier(currentPos, { x: currentPos.x + values[0], y: currentPos.y + values[1] })
                );
                currentPos = { x: currentPos.x + values[0], y: currentPos.y + values[1] };
                break;
            case "C": // Cubic Bezier (absolute)
                bezierCurves.push({
                    type: "C",
                    start: { ...currentPos },
                    control1: { x: values[0], y: values[1] },
                    control2: { x: values[2], y: values[3] },
                    end: { x: values[4], y: values[5] },
                });
                currentPos = { x: values[4], y: values[5] };
                break;
            case "c": // Cubic Bezier (relative)
                bezierCurves.push({
                    type: "C",
                    start: { ...currentPos },
                    control1: { x: currentPos.x + values[0], y: currentPos.y + values[1] },
                    control2: { x: currentPos.x + values[2], y: currentPos.y + values[3] },
                    end: { x: currentPos.x + values[4], y: currentPos.y + values[5] },
                });
                currentPos = { x: currentPos.x + values[4], y: currentPos.y + values[5] };
                break;
            case "Q": // Quadratic Bezier (absolute)
                bezierCurves.push(
                    convertQuadraticToCubic(currentPos, { x: values[0], y: values[1] }, { x: values[2], y: values[3] })
                );
                currentPos = { x: values[2], y: values[3] };
                break;
            case "q": // Quadratic Bezier (relative)
                bezierCurves.push(
                    convertQuadraticToCubic(
                        currentPos,
                        { x: currentPos.x + values[0], y: currentPos.y + values[1] },
                        { x: currentPos.x + values[2], y: currentPos.y + values[3] }
                    )
                );
                currentPos = { x: currentPos.x + values[2], y: currentPos.y + values[3] };
                break;
            case "A": // Arc to Bezier (absolute)
                let arcCurves = convertArcToCubic(currentPos, values);
                bezierCurves.push(...arcCurves);
                currentPos = arcCurves[arcCurves.length - 1].end;
                break;
            case "a": // Arc to Bezier (relative)
                let arcCurvesRel = convertArcToCubic(currentPos, [
                    values[0],
                    values[1],
                    values[2],
                    values[3],
                    values[4],
                    currentPos.x + values[5],
                    currentPos.y + values[6],
                ]);
                bezierCurves.push(...arcCurvesRel);
                currentPos = arcCurvesRel[arcCurvesRel.length - 1].end;
                break;
            case "Z":
            case "z": // Close Path
                bezierCurves.push(convertLineToBezier(currentPos, startPoint));
                currentPos = { ...startPoint };
                break;
            // Handle more commands as needed...
        }
    });

    return bezierCurves;
}

// Convert a line segment to a degenerate cubic Bezier curve
function convertLineToBezier(start, end) {
    return {
        type: "C",
        start: start,
        control1: start,
        control2: end,
        end: end,
    };
}

// Convert a quadratic Bezier curve to cubic
function convertQuadraticToCubic(start, control, end) {
    let control1 = {
        x: start.x + (2 / 3) * (control.x - start.x),
        y: start.y + (2 / 3) * (control.y - start.y),
    };
    let control2 = {
        x: end.x + (2 / 3) * (control.x - end.x),
        y: end.y + (2 / 3) * (control.y - end.y),
    };
    return {
        type: "C",
        start: start,
        control1: control1,
        control2: control2,
        end: end,
    };
}

// Convert an arc to cubic Bezier curves
function convertArcToCubic(start, [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y]) {
    // Implementation of SVG arc to cubic Bezier conversion
    // This is complex math and typically relies on established algorithms
    // For now, using a stub or an existing library may be useful
    // Here you would calculate cubic Bezier control points for an arc
    let curves = []; // Array of cubic curves representing the arc
    // Code for the conversion...
    return curves;
}
