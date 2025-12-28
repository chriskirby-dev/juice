/**
 * HTML link rewriting utilities for path resolution.
 * Updates relative links in HTML content to new paths.
 * @module HTML/Relink
 */

import path from "path";

/**
 * Updates relative links in HTML content to new directory context.
 * @param {string} content - HTML content with links to update
 * @param {string} currentDir - Current directory of the content
 * @param {string} relinkDir - Target directory for relinked paths
 * @returns {string} HTML content with updated links
 */
// Function to update relative links in layout document
export function relink(content, currentDir, relinkDir) {
    // Replace relative links in layout content with updated paths
    const updatedLayoutContent = content.replace(
        /(["'])([^"']+\.(css|js|html|jpg|jpeg|png|gif))(["'])/gi,
        (match, p1, p2, p3, p4) => {
            const absolutePath = path.resolve(currentDir, p2);
            const relativePath = path.relative(relinkDir, absolutePath);
            return `${p1}${relativePath}${p4}`;
        }
    );

    return updatedLayoutContent;
}