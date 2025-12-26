/**
 * HTML content manager with template loading and token replacement.
 * Supports file loading, includes, and dynamic content rendering.
 * @module HTML/Content
 */

import { type } from "../Util/Core.mjs";
import { METHOD_CALL, NUMERIC } from "../Util/Regex.mjs";
import Assert from "../Util/Assert.mjs";
import Tokenizer from "./Tokenizer.mjs";
import path from "path";
import fs from "fs";

/**
 * Checks if a string is a file path or URL.
 * @private
 * @param {string} input - String to check
 * @returns {boolean} True if input is a path or URL
 */
function isPathOrURL(input) {
    // Regular expressions to match paths and URLs
    const pathRegex = /^(\/|\.\/|\.\.\/|[a-zA-Z]:\\|file:\/\/\/|[a-zA-Z]:\\|\\|\/\/).*/; // Matches paths
    const urlRegex = /^(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i; // Matches URLs

    if (pathRegex.test(input)) {
        return true;
    } else if (urlRegex.test(input)) {
        return true;
    } else {
        return false;
    }
}

function loadExternalTemplate(path) {}

/**
 *  Allowed Patterns
 *  
 *  Load file into <template> element
 *  {template [id {String}]{[token {Path}]}} 
 *  **Existing template elements remain untouched including any variable references
 *  
 *  Load file into <script> element
 *  {script [id {String}]{[token {Path}]}}
 *
 *  Load file into <style> element
 *  {style [id {String}]{[token {Path}]}}

 *  Include tpl file 
 *  {include [../path/to/file.tpl]{[token {*}]}}
 *
 *  Token values
 *  {{[token {string...}]}}
 *  || Fallback Value if previous value is undefined
 *  "" String/Default values
 *
 *  
 *  {tpl [id {String}]{[pointer {Path}]}}
 */

/**
 * Content manager for loading and rendering HTML templates.
 * Handles file loading, tokenization, and dynamic content replacement.
 * @class Content
 */
class Content {
    tpls = {};
    tplRaw = {};

    /**
     * Creates a Content instance from a source path or HTML string.
     * @param {string} src - File path or HTML string
     * @param {Object} [options={}] - Options including dir, tokens
     */
    constructor(src, options = {}) {
        this.options = options;
        if (Assert.isLocation(src)) {
            this.srcPath = src;
            this.loadFiles();
        } else {
            this.initialize(src);
        }
    }

    loaded() {
        return new Promise((resolve) => {
            this._loaded = resolve;
            if (this.ready) resolve();
        });
    }

    async loadFiles() {
        this.dir = this.srcPath.substring(0, Math.max(this.srcPath.lastIndexOf("/"), this.srcPath.lastIndexOf("\\")));
        console.log(`Directory set to: ${this.dir}`);

        let src = fs.readFileSync(this.srcPath, "utf8");
        console.log(`Source file content loaded from: ${this.srcPath}`);

        this.initialize(src);

        /*
        const TEMPLATES = /\{template (\w+)\{"([^"]+)"\}\}/g;
        src = src.replace(TEMPLATES, (match, tplid, tplpath) => {
            const tplSrcPath = path.resolve(this.dir, tplpath);
            console.log(`Processing template with ID: ${tplid}, Path: ${tplSrcPath}`);
            
            const contents = fs.readFileSync(tplSrcPath, 'utf8');
            console.log(`Template content loaded for ID: ${tplid}`);
            
            return `<template id="${tplid}">
            ${contents}
            </template>`;
        });

        this.initialize(src);
        */
    }

    initialize(src) {
        console.log("Initializing with source:", src);

        if (this.options.dir) {
            this.dir = this.options.dir;
            console.log("Directory set to:", this.dir);
        }

        this.source = src;
        console.log("Source set.");

        this.tokenized = new Tokenizer(this.source, this.data, { root: this.dir });
        console.log("Tokenizer initialized with source and data.");

        console.log("Options:", this.options);
        if (this.options.tokens) {
            this.rendered = this.replaceTokens(this.options.tokens);
            console.log("Tokens replaced.");
        }

        if (this._loaded) {
            this._loaded();
            console.log("Loaded callback executed.");
        }

        this.ready = true;
        console.log("Initialization complete, ready set to true.");
    }

    /**
     * Creates a Content instance from a template element in the DOM.
     * @param {string} id - Template element ID
     * @param {Object} data - Data for token replacement
     * @returns {string} Rendered content
     * @static
     */
    static fromTemplate(id, data) {
        const template = document.getElementById(id);
        const content = new Content(template.innerHTML);
        return content.replaceTokens(data);
    }

    parseConditional(string) {}

    /**
     * Replaces tokens in content with actual data values.
     * @param {Object} data - Data to use for token replacement
     * @param {string} [content] - Content to replace tokens in (uses tokenized if not provided)
     * @param {boolean} [internal] - Internal flag for nested calls
     * @returns {string} Content with tokens replaced
     */
    replaceTokens(data, content, internal) {
        content = this.tokenized.render(data);

        return content;
    }
}

export default Content;