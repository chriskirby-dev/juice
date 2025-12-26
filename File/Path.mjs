/**
 * File path manipulation utilities.
 * Provides functions for working with file and directory paths.
 * @module File/Path
 */

/**
 * Extracts the directory portion of a path.
 * @param {string} pathStr - The path string
 * @returns {string} The directory path
 * @example
 * directory('/home/user/file.txt') // Returns: '/home/user'
 */
export function directory(pathStr) {
    return pathStr.replace(/\/?[^\/]*$/, "");
}

/**
 * Checks if a path is relative (not absolute).
 * @param {string} pathStr - The path string to check
 * @returns {boolean} True if the path is relative
 * @example
 * isRelative('./file.txt') // Returns: true
 * isRelative('/home/user/file.txt') // Returns: false
 */
export function isRelative(pathStr) {
    return !/^(\/|\\|[a-zA-Z]:)/.test(pathStr);
}

/**
 * Extracts the file extension from a path.
 * @param {string} pathStr - The path string
 * @returns {string} The file extension (without the dot)
 * @example
 * extention('/path/to/file.txt') // Returns: 'txt'
 */
export function extention(pathStr) {
    return pathStr.replace(/.*\./, "");
}

/**
 * Normalizes a path by resolving . and .. segments.
 * @param {string} path - The path to normalize
 * @returns {string} The normalized path
 * @example
 * normalize('/home/user/../admin/./file.txt') // Returns: '/home/admin/file.txt'
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
 * Resolves multiple path segments into a single absolute path.
 * @param {...string} paths - Path segments to resolve
 * @returns {string} The resolved absolute path
 * @example
 * resolve('/home', 'user', '../admin', 'file.txt') // Returns: '/home/admin/file.txt'
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