import { row } from "../../../Form/VirtualBuilder.mjs";
import Component from "../Component.mjs";

const KEY_GROUPS = {
    qwerty: [
        [{ key: "Q", code: "KeyQ" },
        { key: "W", code: "KeyW" },
        { key: "E", code: "KeyE" },
        { key: "R", code: "KeyR" },
        { key: "T", code: "KeyT" },
        { key: "Y", code: "KeyY" },
        { key: "U", code: "KeyU" },
        { key: "I", code: "KeyI" },
        { key: "O", code: "KeyO" },
        { key: "P", code: "KeyP" }],
        { key: "A", code: "KeyA" },
        { key: "S", code: "KeyS" },
        { key: "D", code: "KeyD" },
        { key: "F", code: "KeyF" },
        { key: "G", code: "KeyG" },
        { key: "H", code: "KeyH" },
        { key: "J", code: "KeyJ" },
        { key: "K", code: "KeyK" },
        { key: "L", code: "KeyL" }],
        [{ key: "Z", code: "KeyZ" },
        { key: "X", code: "KeyX" },
        { key: "C", code: "KeyC" },
        { key: "V", code: "KeyV" },
        { key: "B", code: "KeyB" },
        { key: "N", code: "KeyN" },
        { key: "M", code: "KeyM" }]
    ],
    wasd: [
        [{ key: "W", code: "KeyW" }],
        [
            { key: "A", code: "KeyA" },
            { key: "S", code: "KeyS" },
            { key: "D", code: "KeyD" }
        ]
    ],
    arrows: [
        [{ key: "↑", code: "ArrowUp" }],
        [
            { key: "↓", code: "ArrowDown" },
            { key: "←", code: "ArrowLeft" },
            { key: "→", code: "ArrowRight" }
        ]
    ]
};

export default class KeyGroup extends Component.HTMLElement {
    static tag = "ui-key-group";
    static config = {
        properties: {
            layout: { type: "string", default: "qwerty", allowed: ["qwerty", "wasd", "arrows"] }
        }
    };

    static observed() {
        return ["layout"];
    }

    static html() {
        return `<div id="key-group" class="ui-key-group" data-layout="${this.layout}"><slot></slot></div>`;
    }

    static get style() {
        return [
            {
                ":host": {
                    display: "block",
                    position: "relative",
                    width: "100%",
                    height: "100%"
                },
                "#key-group": {
                    display: "block",
                    position: "relative",
                    width: "100%",
                    height: "100%"
                }
            }
        ];
    }

    onFirstConnected() {
        // Initialization code here
        const group = KEY_GROUPS[this.layout] || [];
        group.forERach(row  => {
            const domRow = document.createElement("div");
            domRow.classList.add("row");
            this.appendChild(domRow);
            row.forEach((keyData) => {
                const keyElement = document.createElement("ui-key");
                keyElement.setAttribute("key", keyData.key);
                keyElement.setAttribute("code", keyData.code);
                this.keys[keyData.key] = keyElement;
                domRow.appendChild(keyElement);
            });

        });
    }
}
