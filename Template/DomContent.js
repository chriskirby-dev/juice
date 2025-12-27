/**
 * DOM content manager with template token extraction.
 * Manages dynamic content in the DOM with variable substitution.
 * @module Template/DomContent
 */

import EventEmitter from "../Event/Emitter.mjs";
import Token from "./Token.js";
import Context from "./Context.js";
import path from "node:path";
import { type } from "node:os";

/**
 * DOM-based template content manager.
 * @class DomContent
 */
class DomContent {
    static extract() {
        const tokens = { head: [] };
        const head = document.getElementsByTagName("head")[0];
        const headWalker = document.createTreeWalker(head, NodeFilter.SHOW_COMMENT, null, false);
        let tokenContent = "";
        let currentComment;
        while ((currentComment = headWalker.nextNode())) {
            let string = currentComment.textContent.trim();
            if (string.startsWith("TOKEN:")) {
                const markers = string.matchAll(/TOKEN\S*/g);
                markers = markers.map((m) => m[0]);
                string = string.split(markers.shift()).pop();

                const regex = /([a-zA-Z_][\w-]*)="([^"]*)"/g;

                const props = {};
                let match;
                while ((match = regex.exec(input))) {
                    const [, key, value] = match;
                    props[key] = value;
                }

                if (markers.length > 1) {
                }

                tokens.head.push(currentComment.textContent);
            }
        }
        return tokenContent;
    }

    constructor() {
        this.bindings = new Map();
    }

    setContext(context) {
        if (!this.context) this.context = new Context(context);
        else this.context.update(context);
    }
}