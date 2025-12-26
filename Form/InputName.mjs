/**
 * Input name utility for form field naming conversions.
 * Converts between different naming formats (ID, label, text).
 * @module Form/InputName
 */

import Str from "../Util/String.mjs";

/**
 * Utility for converting input names to IDs and labels.
 * @class InputName
 * @param {string} text - Input name text
 * @example
 * const name = new InputName('user_email');
 * console.log(name.toId()); // 'user-email'
 * console.log(name.toLabel()); // 'User Email'
 */
class InputName {
    /** @type {string} Input name text */
    text;
    /** @type {string} Label text */
    label;
    /** @type {string} ID string */
    id;
    
    constructor(text) {
        this.text = text;
    }

    /**
     * Converts name to HTML ID format (kebab-case).
     * @returns {string} ID-formatted string
     */
    toId() {
        return (
            this.id ||
            this.text
                .replace(/\s+/g, "-") // Replace spaces with -
                .replace(/[^\w\-]+/g, "") // Remove all non-word chars
                .replace(/\-\-+/g, "-") // Replace multiple - with single -
                .replace(/^-+/, "") // Trim - from start of text
                .replace(/-+$/, "")
        ); // Trim - from end of text
    }

    /**
     * Converts name to label format (Title Case).
     * @returns {string} Label-formatted string
     */
    toLabel() {
        return (
            this.label ||
            Str.ucwords(this.text)
                .replace(/[_-]/g, "-") // Replace spaces with -
                .replace(/[^\w\-]+/g, "") // Remove all non-word chars
                .replace(/^-+/, "") // Trim - from start of text
                .replace(/-+$/, "")
        ); // Trim - from end of text
    }

    /**
     * Returns string representation.
     * @returns {string} Name text
     */
    toString() {
        return `${this.text}`;
    }
}

export default InputName;