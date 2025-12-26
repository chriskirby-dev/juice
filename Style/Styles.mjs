/**
 * Style management module for CSS styling and vendor prefixing.
 * @module Style/Styles
 */
import browser from "../Client/Browser.mjs";
import CssParser from "./Parser.mjs";
import { type } from "../Util/Core.mjs";

/**
 * Manages CSS style properties with text output formatting.
 * @class StyleProperties
 */
export class StyleProperties {
    props = {};

    constructor(props = {}) {
        this.props = props;
    }

    add(prop, value) {}

    asText(seperator = " \n") {
        const props = [];
        for (let prop in this.props) {
            const type = prop.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
            const value = this.props[prop];
            props.push(`${type}: ${value};`);
        }
        return props.join(seperator);
    }
}

/**
 *  @class Style
 * 	@constructor {string} className - The CSS class name
 * 	@constructor {object} properties - The CSS properties
 *  	@property {string} className - The CSS class name
 *  	@property {object}
 */

class Style {
    type = "class";
    properties = {};

    constructor(className, props) {
        this.className = className;
        this.properties = props;
        if (className.indexOf("@keyframes") != -1) {
            this.type = "keyframes";
        } else if (className.indexOf("@media") != -1 || className.indexOf("@container") != -1) {
            this.type = "query";
        }
    }

    static prefix(_props) {
        var props = {};
        for (prop in _props) {
            if (typeof _props[prop] == "object") {
                props[prop] = Style.prefix(_props[prop]);
            } else {
                var k = prop.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
                if (prefixed.indexOf(k) != -1) {
                    props[k] = _props[prop];
                    if (browser.prefix && browser.prefix.css) props[browser.prefix.css + k] = _props[prop];
                } else {
                    props[k] = _props[prop];
                }
            }
        }
        return props;
    }

    text() {
        return `${this.className} { 
        ${this.propertyText()}
        }
		`;
    }

    propertyText() {
        var txt = ``;
        for (let prop in this.properties) {
            var k = prop.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
            txt += "\t" + k;
            if (typeof this.properties[prop] == "object") {
                txt += "{ " + this.toText(this.properties[prop]) + " } ";
            } else {
                txt += ":" + this.properties[prop] + ";" + "\n";
            }
        }
        return txt;
    }
}

class Styles extends Array {
    classes = [];

    constructor(...styles) {
        super();
        for (let i = 0; i < styles.length; i++) {
            if (typeof styles[i] == "string") {
                this.addMany(CssParser.toObject(styles[i]));
            } else {
                this.addMany(styles[i]);
            }
        }
    }

    find() {}

    add(className, properties) {
        const style = new Style(className, properties);
        this.push(style);
        this.classes.push(className);
    }

    addMany(styles) {
        for (let className in styles) {
            if (className == "@text") {
                this.addCSS(styles[className]);
            } else {
                this.add(className, styles[className]);
            }
        }
    }

    addCSS(cssString) {
        this.push(cssString);
    }

    asText(includeTag = false) {
        let txt = includeTag ? "<style> \n" : "";
        for (let i = 0; i < this.length; i++) {
            if (typeof this[i] == "string") {
                txt += this[i];
            } else {
                txt += this[i].text();
            }
        }
        txt += includeTag ? "</style>" : "";
        return txt;
    }

    asSheet(id) {
        var styleSheet = document.createElement("style");
        styleSheet.id = id;
        styleSheet.type = "text/css";
        styleSheet.disabled = false;

        if (styleSheet.styleSheet) {
            styleSheet.styleSheet.cssText = this.asText();
        } else {
            styleSheet.appendChild(document.createTextNode(this.asText()));
        }
        this.styleSheet = styleSheet;
        return styleSheet;
    }
}

class StyleSheet {
    index = {};
    tag;
    constructor(id, sheet) {
        this.id = id;
        this.styles = new Styles();
        if (sheet) {
            this.tag = sheet;
        }
    }

    clear() {
        if (this.tag.styleSheet) {
            this.tag.styleSheet.cssText = "";
        } else {
            this.tag.innerHTML = "";
            this.tag.appendChild(document.createTextNode(""));
        }
    }

    add(styles) {
        const styleContent = type(styles, "string")
            ? styles
            : new Styles(...(type(styles, "array") ? styles : [styles])).asText();
        if (this.tag.styleSheet) {
            this.tag.styleSheet.cssText += styleContent;
        } else {
            this.tag.appendChild(document.createTextNode(styleContent));
        }
    }

    find(selector) {
        const result = [];
        const cssRules = this.tag.sheet ? this.tag.sheet.cssRules : this.tag.cssRules;
        if (cssRules.length > 0) {
            for (var i = 0; i < cssRules.length; i++) {
                var rule = cssRules[i];
                if (rule.selectorText === selector) {
                    result.push(rule);
                }
            }
        }
        return result;
    }

    update(selector, properties) {
        const items = this.find(selector);
        if (!items.length) return this.insert(selector, properties);
        items.forEach((item) => {
            for (var prop in properties) {
                var k = prop.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
                item.style[k] = properties[prop];
            }
        });
    }

    insertText(cssText) {
        const styles = CssParser.toObject(cssText);
        styles.forEach((style) => {
            this.insert(style);
        });
    }

    insert(selector, properties, i) {
        const index = i || this.tag.sheet.cssRules.length;
        const style = new Style(selector, properties);
        this.tag.sheet.insertRule(style.text(), index);
    }

    create() {
        var styleSheet = document.createElement("style");
        styleSheet.id = this.id;
        styleSheet.type = "text/css";
        styleSheet.disabled = false;

        if (styleSheet.styleSheet) {
            styleSheet.styleSheet.cssText = "";
        } else {
            styleSheet.appendChild(document.createTextNode(""));
        }
        this.tag = styleSheet;
        return styleSheet;
    }
}

export { Styles as default, Style, StyleSheet };