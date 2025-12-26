/**
 * DomainWrapper provides a base class for Chrome DevTools Protocol domain wrappers.
 * Manages connection state, domain initialization, and readiness events.
 * @module ChromeProtocol/DomainWrapper
 */

import EventListener from "events";
import ChromeProtocol from "./ChromeProtocol.js";

/**
 * Base class for wrapping Chrome DevTools Protocol domains.
 * Handles setup, initialization, and lifecycle management for CDP domains.
 * @class DomainWrapper
 * @extends EventListener
 */
class DomainWrapper extends EventListener {
    /**
     * Indicates whether the domain wrapper is ready for use.
     * @type {boolean}
     */
    ready = false;

    /**
     * Creates a new DomainWrapper instance.
     * @param {ChromeProtocol} cdp - The Chrome DevTools Protocol instance
     */
    constructor(cdp) {
        super();
        this.cdp = cdp;
        if (cdp.connected) this.setup();
        else {
            this.setup = this.setup.bind(this);
            cdp.on("connect", this.setup);
        }
    }

    /**
     * Gets the viewport/webContents from the CDP instance.
     * @returns {*} The viewport object
     */
    get viewport() {
        return this.cdp.webContents;
    }

    /**
     * Gets the CDP client instance.
     * @returns {*} The client object
     */
    get client() {
        return this.cdp.client;
    }

    /**
     * Starts the domain wrapper. Override in subclasses.
     */
    start() {}

    /**
     * Returns a promise that resolves when the domain wrapper is ready.
     * @returns {Promise<boolean>} Resolves to true when ready
     */
    async isReady() {
        if (this.ready) return Promise.resolve(true);
        return new Promise((resolve, reject) => {
            this.once("ready", resolve);
        });
    }

    /**
     * Sets up the domain wrapper by enabling required CDP domains.
     * Calls addListeners() and initialize() if defined in subclasses.
     * @returns {Promise<void>}
     */
    async setup() {
        //debug('wrapper setup', this.constructor.name, this.constructor.uses);

        if (this.addListeners) this.addListeners();

        this.domains = await this.cdp.enable(...this.constructor.uses);

        if (this.initialize) {
            //debug('call initialize');
            this.initialize();
        }
        this.ready = true;
        this.emit("ready");
        //debug('ready');
    }
}

export default DomainWrapper;
