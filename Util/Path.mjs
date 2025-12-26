/**
 * Path utility module providing path manipulation and normalization functions.
 * Handles both Unix and Windows path formats, supports relative/absolute path resolution.
 * @module Path
 */

/**
 * Extracts the directory path from a full file path.
 * @param {string} pathStr - The file path
 * @returns {string} The directory path without the filename
 * @example
 * directory("/path/to/file.txt") // returns "/path/to"
 */
export function directory(pathStr) {
    return pathStr.replace(/\/?[^\/]*$/, "");
}

/**
 * Checks if a path is relative (not absolute).
 * Tests against Unix absolute paths (/) and Windows absolute paths (C:\, D:\, etc.).
 * @param {string} pathStr - The path to check
 * @returns {boolean} True if path is relative
 * @example
 * isRelative("./file.txt") // returns true
 * isRelative("/absolute/path") // returns false
 * isRelative("C:\\Windows\\file") // returns false
 */
export function isRelative(pathStr) {
    return !/^(\/|\\|[a-zA-Z]:)/.test(pathStr);
}

/**
 * Extracts the file extension from a path.
 * @param {string} pathStr - The file path
 * @returns {string} The file extension without the dot
 * @example
 * extention("file.txt") // returns "txt"
 */
export function extention(pathStr) {
    return pathStr.replace(/.*\./, "");
}

/**
 * Normalizes a path by resolving . and .. segments.
 * Handles both Unix and Windows path formats.
 * @param {string} path - The path to normalize
 * @returns {string} The normalized path
 * @example
 * normalize("/path/to/../file.txt") // returns "/path/file.txt"
 * normalize("./some/./path") // returns "/some/path"
 */
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

/**
 * Resolves multiple path segments into a single normalized path.
 * Absolute path segments reset the resolution. Relative segments are joined.
 * @param {...string} arguments - Variable number of path segments to resolve
 * @returns {string} The resolved normalized path
 * @example
 * resolve("/base", "dir", "file.txt") // returns "/base/dir/file.txt"
 * resolve("base", "/absolute", "file.txt") // returns "/absolute/file.txt"
 */
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
