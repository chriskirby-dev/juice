import { vElement } from "../VirtualBuilder.mjs";

const crossHair = vElement("div", { class: "crosshair round" }, [
    div({ class: "line vertical w-1px h-120 centered" }),
    div({ class: "line horzontal h-1px w-120 centered" }),
]);

const activator = vElement("a", { class: "activator block absolute height-80 aspect-ratio-1" }, [crossHair()], {
    events: {
        click: function (e) {
            this.clone().appendTo(document.body);
            this.dispatchEvent(new CustomEvent("click", { detail: { clone: this.clone() } }));
        },
    },
});

export default vElement.make("div", { class: "target-input" }, [
    activator({ class: "" }),
    input({ name: "target", type: "text" }),
]);
