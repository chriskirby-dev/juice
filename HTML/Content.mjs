import { type } from "../Util/Core.mjs";
import { METHOD_CALL, NUMERIC } from "../Util/Regex.mjs";
import Assert from "../Util/Assert.mjs";
import Tokenizer from "./Tokenizer.mjs";
import path from "path";
import fs from "fs";

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

class Content {
    tpls = {};
    tplRaw = {};

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

    static fromTemplate(id, data) {
        const template = document.getElementById(id);
        const content = new Content(template.innerHTML);
        return content.replaceTokens(data);
    }

    parseConditional(string) {}

    replaceTokens(data, content, internal) {
        content = this.tokenized.render(data);

        return content;
    }
}

export default Content;