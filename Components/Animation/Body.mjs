import Component from "../Component.mjs";

class AnmationBody extends Component {
    static config = {
        name: "animation-stage",
        tag: "animation-stage",
        template: false,
        style: false,
    };

    static get observed() {
        return {
            all: ["width", "height", "x", "y", "z", "r", "rx", "ry", "rz"],
            attributes: [],
            properties: [],
        };
    }

    static get style() {
        return [
            {
                ".animation-body": {
                    display: "block",
                    position: "relative",
                    width: "100%",
                    height: "100%",
                },
            },
        ];
    }

    static html(data = {}) {
        return `<div id="body" class="animation-body"><slot></slot></div>`;
    }

    onAttributeChanged() {}
}
