import EventListener from "events";
import ChromeProtocol from "./ChromeProtocol.js";

class DomainWrapper extends EventListener {
    ready = false;

    constructor(cdp) {
        super();
        this.cdp = cdp;
        if (cdp.connected) this.setup();
        else {
            this.setup = this.setup.bind(this);
            cdp.on("connect", this.setup);
        }
    }

    get viewport() {
        return this.cdp.webContents;
    }

    get client() {
        return this.cdp.client;
    }

    start() {}

    async isReady() {
        if (this.ready) return Promise.resolve(true);
        return new Promise((resolve, reject) => {
            this.once("ready", resolve);
        });
    }

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
