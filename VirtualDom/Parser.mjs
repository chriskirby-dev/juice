import vElement from "./Element.mjs";

import { type, empty, default as Util } from "../Util/Core.mjs";
import { clean, getnodeType } from "./Util.mjs";

/*
Parser.onText = ( text ) => {
    return text;
}
*/

class Parser {
    static type(source) {
        if (type(source, "string")) {
            //Is String Content
            if (/<\/?[a-z][\s\S]*>/i.test(source)) {
                //Detected HTML Tag
                return "html";
            } else {
                return "text";
            }
        } else if (source instanceof Element) {
            return "dom";
        } else if (type(source, "object")) {
            return "vdom";
        }
    }

    static fromText(content) {
        //No Tags Detected Plain String Content
        const paragraphs = content.split(/\n\s*\n/);
        if (paragraphs.length > 1) {
            return {
                tag: "div",
                children: paragraphs.map((p) => {
                    return { tag: "p", children: content.split(/\n/).join("<br>") };
                }),
            };
        } else {
            return { tag: "div", children: content.split(/\n/).join("<br>") };
        }
    }

    static onText(resp) {
        return resp;
    }

    static onElement(vE) {
        return vE;
    }

    static parse(data) {
        if (Util.type(data, "string")) {
            if (/<\/?[a-z][\s\S]*>/i.test(data)) {
                //Detected HTML Tag
                return this.fromHTML(data);
            } else {
                //No Tags Detected Plain String Content
                return this.fromText(data);
            }
        } else if (data.tagName) {
            return this.fromDom(data);
        } else {
            return data;
        }
    }

    static fromHTMLString(html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, "text/html");
        clean(doc.body);
        return doc.body;
    }

    static fromHTML(html, namespace = null) {
        const dom = document.createElement("template");

        dom.innerHTML = html.trim();
        clean(dom.content);

        return this.fromDom(dom.content.children.length > 1 ? dom.content : dom.content.children[0], namespace);
    }

    static fromDom(el, namespace) {
        // app.log(el, el.nodeType, el.childNodes, el.namespaceURI, namespace);
        if (el.nodeType === Node.TEXT_NODE) {
            return el.textContent;
        } else if (el.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
            if (el.children.length > 1) {
                const frag = [];
                for (let i = 0; i < el.children.length; i++) {
                    frag.push(Parser.fromDom(el.children[i], namespace));
                }
                return frag;
            } else {
                Parser.fromDom(el.children[0], namespace);
            }
        }
        //Skip Comments
        if ([Node.COMMENT_NODE].includes(el.nodeType)) {
            return "";
        }

        const tag = el.tagName;
        const attrs = {};
        const children = [];
        const options = {};

        let ns = null;
        if (namespace) {
            options.namespace = namespace;
        } else if (el.namespaceURI !== "http://www.w3.org/1999/xhtml") {
            options.namespace = el.namespaceURI;
        }
        if (el.attributes) {
            for (var i = 0, atts = el.attributes, n = atts.length, arr = []; i < n; i++) {
                attrs[atts[i].nodeName] = el.getAttribute(atts[i].nodeName);
            }
        }

        if (el.tagName === "TEMPLATE") {
            children.push(el.innerHTML);
        } else {
            for (let i = 0; i < el.childNodes.length; i++) {
                children.push(Parser.fromDom(el.childNodes[i], namespace));
            }
        }

        return vElement(tag, attrs, children, options);
    }
}

export default Parser;
