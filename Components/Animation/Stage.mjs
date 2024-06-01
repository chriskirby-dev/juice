import Component from "../Component.mjs";
import Timeline from "../../Animation/Timelinie.mjs";

class AnmationStage extends Component {
    static tag = "animation-stage";

    static allowedStates = ["initial", "actve", "inactve", "complete"];

    static config = {
        properties: {
            width: { default: 100, type: "number", unit: "percent" },
            height: { default: 100, type: "number", unit: "percent" },
            frction: { default: 0.6, type: "number", unit: "coefficient" },
            gravity: { default: 9.81, type: "number", unit: "meters per second sq" },
            fps: { default: null, type: "number", unit: "frames per second" },
            state: { default: "initial", type: "string", allowed: AnmationStage.allowedStates },
        },
    };

    static get observed() {
        return {
            all: ["width", "height", "friction", "gravity", "state"],
        };
    }

    static get style() {
        return [
            {
                ":host": {
                    display: "block",
                    position: "relative",
                    width: "100%",
                    height: "100%",
                },
                slot: {
                    display: "block",
                    position: "relative",
                    width: "100%",
                    height: "100%",
                },
            },
        ];
    }

    static html(data = {}) {
        return `<slot></slot>`;
    }

    bodys = [];
    animations= [];


    onAttributeChanged(property, prevous, value) {
        switch (property) {
            case "width":
                this.ref("body").style.width = value;
                break;
            case "height":
                this.ref("body").style.height = value;

                break;
        }
    }

    onFirstConnect(){
        this.timeline = new Timeline(this.fps);
        
        this.timeline.update = (data) => {
            this.animations.forEach( animation => animation.update(data) );
        }
        
        this.timeline.render = (data) => {
            this.animations.forEach( animation => animation.render(data) );
        }

        this.timeline.complete = () => {

        }

        this.timeline.start();
    }

    onChildren(children) {

        children.forEach( child => {
            if( child.animate ){
                this.animations.push(child.animate)
            }
        }
    }
}

customElements.define(AnmationStage.tag, AnmationStage);
