/**
 * Component template example demonstrating custom component structure.
 * Shows how to create components with properties, styles, and lifecycle hooks.
 * @module Components/tpl
 */

import Component from "./Component.mjs";

/**
 * Template component demonstrating component creation patterns.
 * Example showing property configuration, styling, and lifecycle methods.
 * @class ComponentTemplate
 * @extends Component.HTMLElement
 * @example
 * // Usage in HTML:
 * // <compopnent-template width="200" height="150"></compopnent-template>
 */
class ComponentTemplate extends Component.HTMLElement {
    /** @type {string} Custom element tag name */
    static tag = "compopnent-template";

    /**
     * Component configuration with properties and defaults.
     * @type {Object}
     * @static
     */
    static config = {
        name: "compopnent-template",
        properties: {
            width: { default: 100, type: "number", unit: "size" },
            height: { default: 100, type: "number", unit: "size" },
        },
    };

    /**
     * Defines which properties and attributes to observe for changes.
     * @type {Object}
     * @static
     */
    static get observed() {
        return {
            all: ["width", "height"],
            attributes: [],
            properties: [],
        };
    }

    /**
     * Returns component HTML template.
     * @returns {string} HTML template string
     * @static
     */
    static html() {
        return `<slot></slot>`;
    }

    /**
     * Returns component styles.
     * @type {Array<Object>}
     * @static
     */
    static get style() {
        return [
            {
                ":host": {
                    position: "relative",
                    display: "block",
                    width: "auto",
                    height: "auto",
                },
            },
        ];
    }

    constructor() {
        super();
    }

    /**
     * Lifecycle hook called when component is created.
     */
    onCreate() {
        this.position = new Vector3d(0, 0, 0);
    }

    /**
     * Lifecycle hook called on first connection to DOM.
     */
    onFirstConnect() {
        this.position = new Vector3d(0, 0, 0);
    }
}