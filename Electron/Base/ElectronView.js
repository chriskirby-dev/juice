import { BaseWindow, WebContentsView } from "electron";

class ElectronView extends WebContentsView {
    browser;
    static instances = {};

    static register(browser, view) {
        if (!this.instances[browser.id]) this.instances[browser.id] = {};
        this.instances[browser.id][view.id] = view;
    }

    constructor(id, browser, options) {
        super(options);
        this.id = id;
        this.browser = browser;
        this.constructor.register(browser, this);
    }

    onWindowResize() {}
}

export default ElectronView;