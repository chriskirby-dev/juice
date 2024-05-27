export function directory(pathStr) {
    return pathStr.replace(/\/?[^\/]*$/, "");
}

export function isRelative(pathStr) {
    return !/^(\/|\\|[a-zA-Z]:)/.test(pathStr);
}

// Function to normalize a path
export function normalize(path) {
    const isAbsoluteUnix = path.startsWith("/");
    const isAbsoluteWindows = /^[a-zA-Z]:[\\/]/.test(path);

    const parts = path.split(/[\\/]/).filter((part) => part !== "");

    const stack = [];
    for (const part of parts) {
        if (part === "..") {
            stack.pop();
        } else if (part !== ".") {
            stack.push(part);
        }
    }

    const normalizedPath = stack.join("/");
    return !isAbsoluteUnix && !isAbsoluteWindows ? `/${normalizedPath}` : normalizedPath;
}

export function resolve() {
    // Convert arguments object to an array
    const paths = Array.from(arguments);

    // Resolve each path segment
    const resolvedPath = paths.reduce((accumulator, currentPath) => {
        if (currentPath.startsWith("/")) {
            // Absolute path encountered, reset accumulator
            accumulator = currentPath;
        } else {
            // Join relative path segment with accumulator
            accumulator = accumulator.replace(/\/?$/, "/") + currentPath;
        }
        return normalize(accumulator);
    }, "");

    return resolvedPath;
}

export default {
    isRelative: isRelative,
    resolve: resolve,
};
