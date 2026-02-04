import Component from "../Component.mjs";

export default class Key extends Component.HTMLElement {

    static tag = "ui-key";

    static config = {
        properties: {
            key: { type: "string", default: "" },
            code: { type: "string", default: "" },
            action: { type: "string", default: "" }
        }
    };

    static observed() {
        return ["key", "code", "action"];
    }

    static html() {
        return `<div id="key" class="ui-key" data-key="${this.key}" data-code="${this.code}" data-action="${this.action}"><slot></slot></div>`;
    }   
    
     static get style() {
        return [
            {
                ":host": {
                    display: "inline-block",
                    position: "relative",
                    width: "40px",
                    height: "40px",
                    margin: "0.5rem",
                    padding: "0.5rem",
                    textAlign: "center",
                    border: "1px solid #90a0be",
                    borderRadius: "5px",
                    cursor: "pointer",
                    userSelect: "none",
                    backgroundColor: "#f0f0f0",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                },
                "#key": {
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                },
                ".pressed": {
                    backgroundColor: "#1c1fd6",
                    color: "#FFF",
                },
            },
        ];
    }


    press(){
        this.ref('key').classList.add('pressed');
    }

    release(){
        this.ref('key').classList.remove('pressed');
    }   

}   