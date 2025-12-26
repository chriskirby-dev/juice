/**
 * HTML parsing utilities for converting DOM elements to structured objects.
 * Supports element parsing, attribute extraction, and nested children handling.
 * @module HTML/Parser
 */

import { type } from "../Util/Core.mjs";
import ArrayUtil from "../Util/Array.mjs";
//const OPEN_TAG_REGEX = /<(.*)="(.*)\$\{(.*)\}(.*)\"(.*)/g;
const OPEN_TAG_REGEX = /<(.*)="(.*)\"(.*)>/g;

const ATTR_REGEX = /([^=\s]+)=["'](.*)\$\{([^}]+)\}(.*)["']/g;
const JS_LITERAL_TOKEN_REGEX = /\$\{(?:[^\}\{]+|\{(?:[^\}\{]+|\{[^\}\{]*\})*\})*\}/g;

/**
 * Parser for converting DOM elements to structured objects.
 * Extracts tag names, attributes, and nested children recursively.
 * @class ElementParser
 */
export class ElementParser {
    /**
     * Parses a DOM element or HTML string into a structured object.
     * @param {Element|string} el - The element to parse or HTML string
     * @returns {Object} Parsed element with tag, attrs, children, and optional namespace
     * @static
     */
    static parse(el) {
        if (type(el, "string")) {
            const tmp = document.createElement("template");
            tmp.innerHTML = el;
            el = tmp.content.cloneNode(true);
            tmp = null;
        }
        const parsed = {
            tag: el.tagName.toLowerCase(),
            attrs: this.attrs(el),
            children: this.children(el),
        };
        if (el.namespaceURI !== "http://www.w3.org/1999/xhtml") {
            parsed.ns = el.namespaceURI;
        }
        return parsed;
    }

    /**
     * Extracts all attributes from a DOM element.
     * @param {Element} el - The element to extract attributes from
     * @returns {Object} Object mapping attribute names to values
     * @static
     */
    static attrs(el) {
        const attrs = {};
        for (var i = 0, atts = el.attributes, n = atts.length, arr = []; i < n; i++) {
            attrs[atts[i].nodeName] = el.getAttribute(atts[i].nodeName);
        }
        return attrs;
    }

    /**
     * Recursively parses all child nodes of an element.
     * @param {Element} el - The element whose children to parse
     * @returns {Array<Object>} Array of parsed child elements
     * @static
     */
    static children(el) {
        const children = [];
        for (let i = 0; i < el.childNodes.length; i++) {
            children.push(this.parse(el.childNodes[i]));
        }
        return children;
    }
}

/**
 * Main HTML parser class.
 * Wrapper around ElementParser for parsing HTML sources.
 * @class HTMLParser
 */
class HTMLParser {
    source;
    tags = [];

    /**
     * Creates an HTML parser for the given source.
     * @param {Element|string} source - HTML element or string to parse
     */
    constructor(source) {
        this.source = source;
    }

    attrs(el) {
        const attrs = {};
        for (var i = 0, atts = el.attributes, n = atts.length, arr = []; i < n; i++) {
            attrs[atts[i].nodeName] = el.getAttribute(atts[i].nodeName);
        }
        return attrs;
    }

    /**
     * Parses the source element.
     * @returns {Object} Parsed element structure
     */
    parse() {
        return ElementParser.parse(this.source);
    }

    /**
     * Static method to parse an element directly.
     * @param {Element|string} el - Element or HTML string to parse
     * @returns {Object} Parsed element structure
     * @static
     */
    static parse(el) {
        return ElementParser.parse(el);
    }
}

/**
 * Parser specifically for HTML tables.
 * Extracts table structure including headers, values, and column spans.
 * @class HTMLTableParser
 */
export class HTMLTableParser {
    /**
     * Creates a table parser for the given table element.
     * @param {HTMLTableElement} table - The table element to parse
     */
    constructor(table) {
        this.rows = [];
        const rows = Array.from(table.querySelectorAll("tr"));
        let r = 0;
        for (let r = 0; r < this.rows.length; r++) {
            const row = rows[r];
            const rowValues = [];
            for (let c = 0; c < row.children.length; c++) {
                const column = row.children[c];
                rowValues.push({
                    type: column.tagName == "TH" ? "header" : "value",
                    text: column.textContent,
                    span: column.getAttribute("colspan") || 1,
                });
            }
            this.rows.push(rowValues);
        }

        console.log(this.rows);
    }
}