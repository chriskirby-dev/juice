import Emitter from "../../Event/Emitter.mjs";

let ResizeObserverInstance;

class ResizeObserverFactory {
    index = 0;
    workers = [];

    constructor() {
        this.initialize();
    }

    observe(el, worker) {
        el.classList.add("observed");
        el._resizeObserverIndex = this.index;
        this.observer.observe(el);
        this.workers[this.index] = worker;
        this.index++;
        return el._resizeObserverIndex;
    }

    unobserve(el) {
        const index = el._resizeObserverIndex;
        this.workers.splice(index, 1);
        this.observer.unobserve(el);
    }

    initialize() {
        this.observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                let width, height;
                let target = entry.target;
                const index = target._resizeObserverIndex;
                const worker = this.workers[index];
                //console.log(entry, worker);
                if (entry.contentBoxSize) {
                    const contentBoxSize = Array.isArray(entry.contentBoxSize)
                        ? entry.contentBoxSize[0]
                        : entry.contentBoxSize;
                    width = contentBoxSize.inlineSize;
                    height = contentBoxSize.blockSize;
                } else {
                    width = entry.contentRect.width;
                    height = entry.contentRect.height;
                }

                if (worker.update) worker.update(width, height);
            }
        });
    }
}

function createObserver() {
    ResizeObserverInstance = new ResizeObserverFactory();
}

class Resize extends Emitter {
    observer;

    constructor(el) {
        super();
        this.init();
        if (el) {
            this.observe(el);
        }
    }

    observe(el) {
        this.el = el;
        this.observer = ResizeObserverInstance.observe(el, this);
    }

    unobserve(el) {
        this.el = el;
        ResizeObserverInstance.unobserve(el);
    }

    update(width, height) {
        if (this.callback) this.callback(width, height);
        this.emit("update", width, height);
    }

    change(callback) {
        this.callback = callback;
    }

    init() {
        if (!ResizeObserverInstance) createObserver();
    }
}

export default Resize;