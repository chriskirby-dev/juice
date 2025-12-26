/**
 * Select dropdown form component.
 * @module Components/Form/FormSelectComponent
 */

import Component from "../Component.mjs";
import { type } from "../../Util/Core.mjs";
import { BaseInput } from "./FormBaseComponents.mjs";
import Dot from "../../Util/DotNotation.mjs";
import { default as SASS, loadFileToString } from "../../Style/SASS.mjs";
import { clean } from "../../VirtualDom/Util.mjs";
const { _filename, __dirname } = currentFile(import.meta);

//const formInputCSS = await loadFileToString(`${__dirname}/sass/component--form-input.scss`);

/**
 * FormSelectBox provides a customizable dropdown select input.
 * @class FormSelectBox
 * @extends BaseInput
 */
class FormSelectBox extends BaseInput {
    static tag = "form-select";
    options = [];
    values = [];
    ready = false;

    emptyLabel = "No Options Available";

    static config = {
        observe: true,
        emitter: true,
        properties: {
            empty: { linked: true },
            default: { linked: true },
            align: { linked: true, default: "left" },
            map: { type: "array" },
        },
    };

    static get observed() {
        return {
            attributes: ["empty", "default", "map", "align"],
            properties: ["empty", "default", "map", "align"],
        };
    }

    static get style() {
        return super.style.concat([
            formInputCSS,
            {
                ":host": {
                    border: "1px solid var(--color-gray)",
                    borderRadius: 0,
                    borderTopRightRadius: "var(--input-border-radius)",
                    background: "var(--input-bg)",
                    minWidth: "10ch",
                    position: "relative",
                    color: "#333",
                },
                ":host(:focus)": {
                    border: "1px solid var(--color-blue)",
                },
                ".container": {
                    position: "relative",
                    height: "53px",
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    alignItems: "center",
                    cursor: "pointer",
                },
                ".options": {
                    boxSizing: "border-box",
                    display: "block",
                    position: "absolute",
                    margin: 0,
                    padding: 0,
                    top: "100%",
                    left: "-1px",
                    background: "#FFFFFF",
                    zIndex: 1000,
                    borderLeft: "1px solid inherit",
                    borderRight: "1px solid inherit",
                    overflow: "hidden",
                    height: 0,
                    minWidth: "100%",
                    maxHeight: "400px",
                    overflow: "hidden",
                },
                ".options slot": {
                    position: "relative",
                    zIndex: 1000,
                },
                ".expanded .options": {
                    height: "auto",
                    border: "1px solid #d2d2d2",
                    boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
                    minWidth: "calc(100% + 2px)",
                    overflowY: "auto",
                },
                ".options .option": {
                    display: "block",
                },
                "::slotted(form-option)": {
                    display: "block",
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid #d2d2d2",
                    cursor: "pointer",
                    width: "100%",
                },
                "::slotted(form-option:last-child)": {
                    borderBottom: 0,
                },
                "::slotted(form-option:hover)": {
                    background: "var(--color-lt-gray)",
                    color: "#333",
                },
                "::slotted(form-option[selected])": {
                    background: "var(--color-blue)",
                    color: "#FFF",
                },
                "::slotted(form-option[default])": {
                    display: "none",
                },
                ".selected-label": {
                    paddingLeft: "0.5rem",
                    paddingRight: "1rem",
                    width: "100%",
                    userSelect: "none",
                    fontSize: "1rem",
                    paddingTop: "1.5rem",
                    paddingLeft: "0.8rem",
                    paddingBottom: "0.25rem",
                    whiteSpace: "nowrap",
                },
                ':host([size="sm"]) .selected-label': {
                    paddingTop: "0",
                },
                ".selected-icon": {
                    position: "relative",
                    height: "100%",
                    width: "34px",
                    marginLeft: "1rem",
                },
                ".selected-icon m-icon": {
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                },
                ".selected-icon svg": {
                    position: "relative",
                    height: "100%",
                    width: "100%",
                },
                ".selected-icon:empty": {
                    display: "none",
                },
                ':host([size="med"]) .container': {
                    height: "47px",
                },

                ':host([size="sm"]) .container': {
                    height: "35px",
                },
                ':host([size="sm"]) .selected-icon': {
                    display: "none",
                },
                ".arrow-blk": {
                    position: "relative",
                    height: "100%",
                    width: "48px",
                    borderLeft: "1px solid #FFF",
                    background: "var(--select-tab-bg)",
                    color: "#FFF",
                    borderRadius: 0,
                    borderTopRightRadius: "var(--input-border-radius) !important",
                    flex: "0 0 auto",
                },
                ".expanded .arrow-blk": {
                    background: "#007bc7",
                    borderBottomRightRadius: "0",
                },
                ".arrow-blk svg": {
                    position: "relative",
                    height: "100%",
                    width: "100%",
                },
                ".arrow-blk .loader": {
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    display: "none",
                },
                ".arrow-blk .loader m-ring": {
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                },
                ".loading .arrow-blk .loader": {
                    display: "block",
                },
                ".loading .arrow-blk svg": {
                    display: "none",
                },
                ":host(:focus)": {
                    outline: "1px solid var(--input-focus)",
                },
                ':host([size="med"]) .arrow-blk': {
                    width: "40px",
                },
                ":host([readonly])": {
                    background: "#FFF",
                },
                ":host([readonly]) .arrow-blk": {
                    background: "#333",
                },
                ":host([readonly]) label:after": {
                    content: `" "`,
                    display: "block",
                    background: `url(/img/read-only.svg)`,
                    width: "30px",
                    height: "30px",
                },
                ":host([readonly]) .options": {
                    display: "none",
                },
                ':host([size="sm"]) .arrow-blk': {
                    width: "35px",
                },
                ".hidden": {
                    width: "0px",
                    height: "0px",
                    overflow: "hidden !important",
                },
                ":host([required]) label:after": {
                    content: `" *"`,
                    color: "var(--color-red)",
                },
                ':host([align="right"]) .options': {
                    left: "auto",
                    right: "-1px",
                },
            },
        ]);
    }

    static html(data) {
        return `
        <div class="hidden">
            <slot ref="hidden" name="hidden"></slot>
        </div>
        <div class="input">
            ${
                this.label
                    ? `<label ref="label" for="${this.id || this.name.replace("_", "-")}">${this.label}</label>`
                    : ""
            }
            
            <div class="container" ref="container">
                <div class="selected-icon" ref="selected-icon" ></div>
                <div class="selected-label" ref="selected-label" ></div>
                <div class="arrow-blk">
                    <div ref="ring" class="loader"> </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 50 50" >
                        <path d="M 17 23 L 25 30 L 33 23" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
                    </svg>
                </div>
            </div>
            <div class="options" ref="list" role="presentation" >
                <slot name="processed" ref="options"></slot>
            </div>
        </div>
        `;
    }

    constructor() {
        super();

        this.onClick = this.onClick.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onOuterClick = this.onOuterClick.bind(this);

        this.addEventListener("mousedown", this.onMouseDown, false);
    }

    type = "select";

    process(element) {
        // console.log('process', element, element.value);
        /**************************
         * MOVE TO PROCESSED SLOT *
         **************************/
        this.options[element.value] = element;
        element.parent = this;
        element.setAttribute("slot", "processed");
        this.values.push(element.value);

        if (element.value == this.value) {
            // console.log('SELECT', element);
            this.select(element);
        }

        //Listen for Selected Event
        element.addEventListener(
            "selected",
            (e) => {
                e.stopPropagation();
                this.select(element);
            },
            false
        );
    }

    onCustomChildReady(child) {
        if (child.tagName == "FORM-OPTION") this.process(child);
    }

    onFirstConnect() {
        super.onFirstConnect();

        this.setAttribute("role", "listbox");

        if (this.hasAttribute("map")) {
            let mapPath = this.getAttribute("map");
            if (mapPath.indexOf("app.data.") == 0) mapPath = mapPath.replace("app.data.", "");
            this.map = Dot.get(mapPath, app.data);
            this.removeAttribute("map");
        }

        if (this.map) {
            this.addOptions(this.map);
        }

        const options = this.ref("options").assignedElements();

        if (this.parentNode.classList.contains("field")) {
            this.field = this.parentNode;
        } else if (this.parentNode.parentNode.classList.contains("field")) {
            this.field = this.parentNode.parentNode;
        }

        if (this.children.length == 0) {
            const noOpts = document.createElement("form-option");
            noOpts.label = this.empty || this.emptyLabel;
            noOpts.setAttribute("noselect", "");
            this.appendChild(noOpts);
        }

        if (this.hasAttribute("default") && !this.values.includes("")) {
            this.addOption("", this.getAttribute("default"), 0, { default: true });
        }
        this.ready = true;
    }

    onReady() {
        const self = this;

        this.onClick = this.onClick.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        if (!this.value) this.value = "";

        //Open on label click
        if (this.field) {
            const label = this.field.querySelector("label");
            if (label) {
                label.addEventListener("click", () => {
                    if (this.expanded) {
                        this.close();
                    } else {
                        this.expand();
                    }
                });
            }
        }

        if (this.ref("label")) {
            this.ref("selected-label").style.minWidth = this.ref("label").$.rect().width + "px";
            this.ref("label").addEventListener("click", () => this.click());
        }

        this.ready = true;
    }

    loading(state) {
        const self = this;

        if (!this.loader) {
            this.loader = document.createElement("m-ring");
            this.loader.size = 25;
            this.loader.animate = true;
            this.loader.color = "#FFF";
            this.ref("ring").appendChild(this.loader);
        }

        if (typeof state === "boolean" && !state) {
            this.loader.stop("success", function () {
                self.ref("html").classList.remove("loading");
            });
        } else {
            this.ref("html").classList.add("loading");
            this.loader.spin();
        }
    }

    resize() {}

    addOption(value, label, index, options) {
        const option = document.createElement("form-option");
        option.value = value;
        option.innerHTML = label || value;

        if (options) {
            option.options = options;
        }

        if (index !== undefined && index !== null && index < this.children.length) {
            if (this.children.length) {
                this.insertBefore(option, this.children[index]);
            } else {
                this.appendChild(option);
            }
        } else {
            this.appendChild(option);
        }
    }

    addOptions(options) {
        if (type(options, "array")) {
            for (let i = 0; i < options.length; i++) {
                const option = options[i];
                const params = [
                    option.value,
                    option.label || option.value,
                    options.index || null,
                    option.options || null,
                ];
                this.addOption(...params);
            }
        } else if (type(options, "object")) {
            for (let value in options) {
                const params = [value, options[value]];
                this.addOption(...params);
            }
        }
    }

    get length() {
        return this.values.length || 0;
    }

    onOuterClick(e) {
        window.removeEventListener("mouseup", this.onOuterClick);
        if (this.expanded) this.close();
    }

    onMouseDown(e) {
        const tagName = e ? e.target.tagName.toLowerCase() : null;

        if (tagName) {
            this.removeEventListener("mousedown", this.onMouseDown);
            e.stopPropagation();
        }

        if (this.expanded) return false;

        this.expand();

        this.addEventListener("mouseup", this.onMouseUp, false);
        window.addEventListener("mouseup", this.onOuterClick, false);
    }

    onMouseUp(e) {
        e.stopPropagation();
        this.removeEventListener("mouseup", this.onMouseUp);
        window.removeEventListener("mouseup", this.onMouseUp);

        const tagName = e ? e.target.tagName.toLowerCase() : null;

        if (tagName === "form-option") {
            return this.select(e.target);
        } else if (tagName === "form-select") {
            setTimeout(() => this.addEventListener("click", this.onClick, false), 0);
            return false;
        } else {
            this.close();
        }
    }

    onClick(e) {
        this.removeEventListener("click", this.onClick);

        const internal = ["form-select", "form-option"];
        const tagName = e ? e.target.tagName.toLowerCase() : null;
        // console.log('onClick', tagName);

        if (internal.includes(tagName)) return false;

        this.close();
    }

    expand() {
        /*********************
         * EXPAND SELECT BOX *
         *********************/
        // console.log('Expand');
        this.styles.replace({
            ":host": {
                borderBottomRightRadius: "0",
                borderBottomLeftRadius: "0",
            },
        });

        this.expanded = true;
        this.ref("html").classList.add("expanded");

        //Close if anything else was clicked
        // window.addEventListener('mouseup', this.close, false );
    }

    onFocus() {
        this.onKeyDown = this.onKeyDown.bind(this);
        this.addEventListener("keydown", this.onKeyDown, false);
        this.expand();
    }

    onBlur() {
        this.removeEventListener("keydown", this.onKeyDown);
        this.close();
    }

    onKeyDown(e) {
        const char = e.key;
        const code = e.keyCode;
        const navCodes = [13, 38, 40];

        if (code == 9) {
            return true;
        }

        if (navCodes.indexOf(code) !== -1) {
            e.preventDefault();
            if (code == 13 && this.currentHL) {
                this.select(this.currentHL);
            } else if (code == 40 && this.currentHL && this.currentHL.nextElementSibling) {
                this.highlight(this.currentHL.nextElementSibling);
            } else if (code == 38 && this.currentHL && this.currentHL.previousElementSibling) {
                this.highlight(this.currentHL.previousElementSibling);
            }
            return;
        }
        if (char.toUpperCase() != char.toLowerCase()) {
            e.preventDefault();
            for (let key in this.options) {
                console.log(key);
                if (this.options[key].value.charAt(0).localeCompare(char) >= 0) {
                    this.highlight(this.options[key]);
                    return;
                }
            }
        }
    }

    close(e) {
        /********************
         * CLOSE SELECT BOX *
         ********************/

        this.styles.clear();

        window.removeEventListener("click", this.close);
        this.expanded = false;
        this.ref("html").classList.remove("expanded");
        this.addEventListener("mousedown", this.onMouseDown, false);
    }

    currentHL = null;

    highlight(option) {
        console.log(option);
        const rect = option.$.rect();
        const ot = option.offsetTop - rect.height;
        this.ref("list").scrollTo(0, ot - rect.height);
        if (this.currentHL) this.currentHL.classList.remove("hl");

        option.classList.add("hl");
        this.currentHL = option;
    }

    select(option, keepOpen = false) {
        // console.log('Select', option, keepOpen);
        if (!option) return;
        //  console.log(`select`, option);
        /*****************
         * SELECT OPTION *
         *****************/

        //Clear currently selected
        const siblings = option.$.siblings;
        for (let i = 0; i < siblings.length; i++) {
            if (siblings[i].hasAttribute("selected")) {
                siblings[i].removeAttribute("selected");
                this.selected = null;
            }
        }

        //Clear Current Icon
        this.ref("selected-icon").innerHTML = "";

        //Mark Selected
        if (!option.hasAttribute("selected")) option.setAttribute("selected", "");

        if (option.icon) {
            //Set Active Icon
            this.ref("selected-icon").appendChild(option.icon);
        }

        //Set Active Label
        this.ref("selected-label").innerHTML = option.label;
        // console.log('Set label');
        this.value = option.value;
        //Set Scoped Input Value

        if (option.icon) {
            if (this.field) this.field.classList.add("has-icon");
            if (this.fieldLabel) {
                const rect = this.ref("selected-icon").$.rect();
                const offset = this.ref("selected-label").offsetLeft;
                this.fieldLabel.style.marginLeft = Math.max(rect.width, 35) + "px";
            }
        } else {
            if (this.field) this.field.classList.remove("has-icon");
        }

        this.selected = option;
        if (this.ready) {
            this.dispatchInput();
            this.dispatchChange();
        }
        //Close Select Box

        if (keepOpen === false && this.expanded) this.close();
        if (keepOpen && !this.expanded) this.expand();
    }

    reset() {
        const nativeInput = this.querySelector("input");
        const defaultOption = this.querySelector('form-option[value=""]');

        this.innerHTML = "";

        if (nativeInput) this.appendChild(nativeInput);

        this.values = [];
        this.options = {};
        this.value = "";

        if (defaultOption) this.select(defaultOption);
    }

    onAttributeChanged(property, old, value) {
        super.onAttributeChanged(property, old, value);
        switch (property) {
            case "value":
                this.value = value;
                break;
            case "empty":
                this.value = value;
                break;
        }
    }

    onPropertyChanged(property, old, value) {
        super.onPropertyChanged(property, old, value);
        switch (property) {
            case "empty":
                this.value = value;
                break;
            case "default":
                const defaultOpt = this.optionByValue("");

                if (defaultOpt) {
                    defaultOpt.label = value;
                    if (defaultOpt.selected) {
                        this.ref("selected-label").innerHTML = defaultOpt.label;
                    }
                } else {
                    this.ref("selected-label").innerHTML = value;
                }
                break;
        }
    }

    onValueChange(value) {
        const element = this.options[value];
        console.log("onValueChange", this.options, value);
        if (element) {
            this.select(element);
        }
    }

    optionByValue(value) {
        for (let i = 0; i < this.children.length; i++) {
            const option = this.children[i];
            if (option.tagName == "FORM-OPTION" && option.value == value) {
                return option;
            }
        }
    }

    get count() {
        return this.querySelectorAll('form-option:not([value=""]):not([noselect])').length;
    }
}

customElements.define(FormSelectBox.tag, FormSelectBox);

class FormOption extends Component.HTMLElement {
    static tag = "form-option";

    static config = {
        observe: true,
        emitter: true,
        properties: {
            value: { linked: true },
            label: { linked: true },
            content: { linked: false },
            default: { linked: true },
            selected: { linked: true },
            options: { type: "object" },
        },
    };

    static get observedAttributes() {
        return ["value", "label", "content", "default", "selected"];
    }

    static get observedProperties() {
        return ["value", "label", "content", "default", "selected", "options"];
    }

    static get style() {
        return {
            ":host": {
                fontSize: "1rem",
                lineHeight: "40px",
            },

            ".option": {
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                padding: "0 0.5rem",
                position: "relative",
            },
            ".label": {
                paddingRight: "1rem",
                width: "100%",
            },
            ":host(.has-descr) .label": {
                lineHeight: "1.3",
                paddingTop: "0.35rem",
            },
            ".icon": {
                height: "40px",
                width: "40px",
                marginRight: "0.5rem",
                display: "none",
            },
            ".icon .safe": {
                position: "relative",
                width: "80%",
                height: "80%",
                left: "10%",
                top: "10%",
            },

            ":::slotted(m-icon)": {
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
            },

            ".has-icon .icon": {
                display: "block",
            },
            ':host([size="med"]) .selected-label': {
                paddingTop: "0.9rem",
            },
            ":host(.hl):not(.sticky)": {
                background: "var(--color-lt-gray)",
            },
        };
    }

    static html(data) {
        return `
            <div class="option" ref="option">
                <div class="icon" >
                    <div class="safe">
                        <slot name="icon" ref="icon" ></slot>
                    </div>
                </div>
                <div class="label" ref="label" ><slot></slot></div>
            </div>
        `;
    }

    get icon() {
        if (this.iconTpl) return this.iconTpl.content.cloneNode(true);
        const iconChildren = this.ref("icon").assignedElements();
        if (iconChildren.length == 0) return null;
        this.iconTpl = document.createElement("template");
        this.iconTpl.innerHTML = iconChildren[0].innerHTML;
        return this.iconTpl.content.cloneNode(true);
    }

    onReady() {
        //Parse Label
        clean(this);

        if (this.querySelector("span")) {
            this.hasLabel = true;
            this.label = this.querySelector("span").innerHTML;
        } else if (
            this.firstChild?.nodeType &&
            this.firstChild?.nodeType == Node.TEXT_NODE &&
            this.firstChild?.textContent &&
            this.firstChild?.textContent.trim().length > 0
        ) {
            this.hasLabel = true;
            this.label = this.firstChild.textContent;
            this.firstChild.parentNode.removeChild(this.firstChild);
        } else if (this.innerText.trim().length > 0 && !this.label.length > 0) {
            this.hasLabel = true;
            this.label = this.innerText;
        }

        if (this.childNodes.length && !this.label) {
            for (let i = 0; i < this.childNodes.length; i++) {
                if (this.childNodes[i].tagName == "SPAN" || this.childNodes[i].nodeType == Node.TEXT_NODE) {
                    this.label = this.childNodes[i].textContent;
                    this.childNodes[i].parentNode.removeChild(this.childNodes[i]);
                }
            }
        }

        if (this.ref("icon").assignedElements().length) {
            this.ref("option").classList.add("has-icon");
        }

        this.setAttribute("role", "option");

        this.addEventListener(
            "click",
            (e) => {
                e.stopPropagation();
                if (!this.hasAttribute("selected") && !this.hasAttribute("noselect")) {
                    this.setAttribute("aria-selected", "");
                    this.setAttribute("selected", "");
                }
            },
            false
        );
    }

    setOptions(options) {
        if (typeof options.selectable == "boolean" && options.selectable === false) {
            this.setAttribute("noselect", "");
        }

        if (options.sticky) {
            this.classList.add("sticky");
        }

        if (options.style) {
            this.styles.replace({
                ":host": options.style,
            });
        }

        if (options.default) {
            this.setAttribute("default", "");
        }
    }

    onPropertyChanged(property, old, value) {
        switch (property) {
            case "label":
                const label = this.querySelector("span") || document.createElement("span");
                label.innerHTML = value;
                this.appendChild(label);
                this.hasLabel = true;

                if (this.hasAttribute("selected")) {
                    if (this.parent) this.parent.ref("selected-label").innerHTML = this.label;
                }
                break;

            case "content":
                break;
            case "options":
                this.setOptions(value);
                break;
            case "selected":
                if (value == "") {
                    this.dispatchEvent(new Event("selected"));
                }
                break;
        }
    }
}

customElements.define(FormOption.tag, FormOption);