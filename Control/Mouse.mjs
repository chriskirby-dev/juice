class Mouse {
    constructor(name) {
        this.name = name;
    }

    bindEvents() {
        document.addEventListener("mousemove", this.run);
        document.addEventListener("mousedown", this.run);
        document.addEventListener("mouseup", this.run);
        document.addEventListener("click", this.run);
        document.addEventListener("dblclick", this.run);
        document.addEventListener("contextmenu", this.run);
        document.addEventListener("wheel", this.run);
        document.addEventListener("mouseleave", this.run);
        document.addEventListener("mouseenter", this.run);
    }
    unbindEvents() {
        document.removeEventListener("mousemove", this.run);
        document.removeEventListener("mousedown", this.run);
        document.removeEventListener("mouseup", this.run);
        document.removeEventListener("click", this.run);
        document.removeEventListener("dblclick", this.run);
        document.removeEventListener("contextmenu", this.run);
        document.removeEventListener("wheel", this.run);
        document.removeEventListener("mouseleave", this.run);
        document.removeEventListener("mouseenter", this.run);
    }
    run() {
        console.log(`${this.name} is running`);
    }
}

export default Mouse;