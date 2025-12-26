import Component from "./Component.mjs";

class ComponentTemplate extends Component.HTMLElement {
    static tag = "compopnent-template";

    static config = {
        name: "compopnent-template",
        properties: {
            width: { default: 100, type: "number", unit: "size" },
            height: { default: 100, type: "number", unit: "size" },
        },
    };

    static get observed() {
        return {
            all: ["width", "height"],
            attributes: [],
            properties: [],
        };
    }

    static html() {
        return `<slot></slot>`;
    }

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

    onCreate() {
        this.position = new Vector3d(0, 0, 0);
    }

    onFirstConnect() {
        this.position = new Vector3d(0, 0, 0);
    }
}