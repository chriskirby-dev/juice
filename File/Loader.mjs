class Loader {
    constructor() {
        this.loading = false;
    }

    load(source) {
        if (type(source) === "string") {
            return this.loadContent(source);
        } else {
            return this.loadImage(source);
        }
    }

    loadContent(source) {
        this.loading = true;
        const req = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            req.addEventListener("load", () => {
                resolve(req.response);
            });
            req.addEventListener("error", () => {
                reject();
            });
            req.open("GET", source, true);
            req.responseType = "text";
            req.send();
        });
    }

    loadImage(source) {
        const image = new Image();
        image.crossOrigin = "Anonymous";
        return new Promise((resolve, reject) => {
            image.addEventListener("load", () => {
                resolve(image);
            });
            image.addEventListener("error", () => {
                reject();
            });
            image.src = source;
        });
    }

    loaded() {
        this.loading = false;
    }

    error() {
        this.loading = false;
        console.log("error");
    }
}
