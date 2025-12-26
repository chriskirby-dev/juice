/**
 * Template engine with live updates, conditionals, loops, and includes.
 * Supports {{expression}}, {{each}}, {{if}}, and {{include}} syntax.
 * @module Template/Template
 */

import nodePath from "node:path";
import fs from "node:fs";
import EventEmitter from "node:events";
import { empty } from "../Util/Core.mjs";
import TokenContent from "./Content.js";
import BlockContext from "./Context.js";

/**
 * Template loader for file system and URL sources.
 * @class Loader
 */
class Loader {
    /** @type {boolean} Loading state */
    loading = false;
    
    /**
     * Loads template from file system.
     * @param {string} filePath - File path
     * @returns {string} File content or error comment
     */
    fromFileSystem(filePath) {
        try {
            return fs.readFileSync(filePath, "utf-8").toString();
        } catch (err) {
            return `<!-- Failed to load ${filePath}: ${err.message} -->`;
        }
    }
    
    /**
     * Loads template from URL.
     * @param {string} url - Template URL
     * @returns {Promise<string>} Template content
     */
    async fromURL(url) {
        return fetch(url).then((res) => res.text());
    }
}

/**
 * Live template engine with reactive bindings and dynamic content.
 * @class TemplateEngine
 * @extends EventEmitter
 * @param {Object} [options={}] - Configuration options
 * @param {Function} [options.loader] - Custom template loader
 * @param {string} [options.root] - Root path for template resolution
 * @fires TemplateEngine#ready When template is parsed and ready
 * @example
 * const engine = new TemplateEngine({
 *   loader: (path) => fs.readFileSync(path, 'utf-8'),
 *   root: './templates'
 * });
 * engine.parse('<h1>{{title}}</h1>', { title: 'Hello' });
 */
class TemplateEngine extends EventEmitter {
    /**
     * Returns content script for DOM element access.
     * @returns {Object} Elements object
     * @static
     */
    static contentScript() {
        const elements = {};
        document.addEventListener("DOMContentLoaded", () => {
            elements.page = document.getElementById("[id]");
            elements.root = document.getElementById("root");
            elements.sidebar = document.getElementById("sidebar");
        });

        return elements;
    }

    constructor({ loader, root } = {}) {
        super();
        this.blocks = [];
        this.root = root || nodePath.dirname(import.meta.url);
        this.loader = loader || ((path) => `<!-- Missing loader for: ${path} -->`);
        this.bindings = new Map(); // Map key -> array of {el, attr} or {el, isTextNode}
    }

    /**
     * Sets template content and triggers parsing.
     * @type {string}
     */
    set template(template) {
        if (this.tpl === template) return;
        this._tpl = template;
        this.load(template);
        this.parse(this._tpl);
    }

    /**
     * Parses template string with context.
     * @param {string} template - Template string
     * @param {Object} [context={}] - Template context variables
     * @returns {Promise<void>}
     * @fires TemplateEngine#ready
     */
    async parse(template, context = {}) {
        console.log("Parsing Template TPL:", template);
        template = template.trim();
        const tokenContent = new TokenContent(template, context, { root: this.root });
        tokenContent.root = this.root;
        tokenContent.on("ready", () => this.emit("ready"));
        this.content = tokenContent;
    }

    load(location) {
        return TokenContent.load(location, this.root);
    }

    async render(template, context) {
        const { string, root } = await this.load(template);
        this.root = root;
        await this.parse(string, context);
        return this.content.render(context);
    }

    async renderToDataURL(template, context) {
        const { string, root } = await this.load(template);
        this.root = root;
        await this.parse(string, context);
        return this.content.renderToDataURL(context);
    }

    async mount(el, template, context) {
        el.innerHTML = this.render(template, context);
    }
}

export default TemplateEngine;