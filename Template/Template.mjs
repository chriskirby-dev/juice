import nodePath from "node:path";
import fs from "node:fs";
import EventEmitter from "node:events";
import { empty } from "../Util/Core.mjs";
import TokenContent from "./Content.js";
import BlockContext from "./Context.js";
// LiveTemplateEngine with support for:
// - {{expression}}
// - {{each list as item}}...{{/each}}
// - {{if condition}}...{{else}}...{{/if}}
// - {{include path}}

class Loader {
    loading = false;
    fromFileSystem(filePath) {
        try {
            return fs.readFileSync(filePath, "utf-8").toString();
        } catch (err) {
            return `<!-- Failed to load ${filePath}: ${err.message} -->`;
        }
    }
    async fromURL(url) {
        return fetch(url).then((res) => res.text());
    }
}

class TemplateEngine extends EventEmitter {
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

    set template(template) {
        if (this.tpl === template) return;
        this._tpl = template;
        this.load(template);
        this.parse(this._tpl);
    }

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