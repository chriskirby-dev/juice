import CDP from "chrome-remote-interface";
import Network from "./Network/Network.js";
import Dom from "./Dom/Dom.js";
import VirtualDom from "./VirtualDom/VirtualDom.js";
import Debugger from "./Debugger.js";
import Target from "./Target.js";
import Page from "./Page/Page.js";
import ChromeDebugWindow from "./UI/ChromeDebugWindow.js";
import EventEmitter from "events";

const domainWrappers = {
    DOM: Dom,
    Network,
    Page,
    Debugger,
    Target,
    Page,
    VirtualDom,
};

class ChromeProtocolTargetClient {
    constructor() {}
}

export async function getTargetFromWebContents(webContents) {
    const wc = webContents;
    if (wc.debugger.isAttached() && wc.devTarget) return wc.devTarget;
    await wc.debugger.attach("1.3");
    const { targetInfo } = await wc.debugger.sendCommand("Target.getTargetInfo");

    wc.devTarget = targetInfo;
    return targetInfo;
}

class ChromeProtocol extends EventEmitter {
    connected = false;
    client = null;
    port;
    _target;
    enabled = [];
    domains = {};
    wrappers = {};
    webContents;

    constructor(webContents) {
        super();
        this.webContents = webContents;
        this.client = null;

        this.connect();
    }

    open() {
        this.ui = new ChromeDebugWindow(this);
        this.ui.setTarget(this._target);
        return new Promise((resolve) => {
            this.ui.on("ready", () => {
                resolve(this.ui);
            });
        });
    }

    getTarget() {
        return this._target;
    }

    getDomainWrapper(domain) {
        if (this.wrappers[domain]) return this.wrappers[domain];
        if (domainWrappers[domain]) {
            this.wrappers[domain] = new domainWrappers[domain](this);
        } else {
            throw new Error("Domain Wrapper not found");
        }
        return this.wrappers[domain];
    }

    get vdom() {
        return this.getDomainWrapper("VirtualDom");
    }

    get dom() {
        return this.getDomainWrapper("DOM");
    }

    get debugger() {
        return this.getDomainWrapper("Debugger");
    }

    get network() {
        return this.getDomainWrapper("Network");
    }

    get page() {
        return this.getDomainWrapper("Page");
    }

    get target() {
        return this.getDomainWrapper("Target");
    }

    preFetch(...domainNames) {
        return domainNames.map((domain) => {
            return this.client[domain];
        });
    }

    async enable(...domainNames) {
        const resp = {};

        const enabling = domainNames
            .map((domain) => {
                resp[domain] = this.client[domain];
                if (this.enabled.includes(domain)) {
                    return Promise.resolve(this.domains[domain]);
                }

                this.domains[domain] = this.client[domain];
                this.enabled.push(domain);
                if (this.client[domain]?.enable) return this.client[domain].enable();
                else return Promise.resolve();
            })
            .filter((domain) => domain);

        return new Promise((resolve) => {
            this.client.on("ready", () => {
                resolve(resp);
            });
        });
    }

    async connect() {
        this._target = await getTargetFromWebContents(this.webContents);
        if (this.connected) return Promise.resolve();
        //this.target = await this.getTargetById(this.targetId);
        console.log("target", this._target);
        //console.log('Chrome Protocol connecting to',this.target);

        return CDP({ targetId: this._target.targetId })
            .then((client) => {
                console.log("CDP Connected");
                this.client = client;
                this.connected = true;
                this.emit("connect", client);
            })
            .catch(console.error);
    }

    async close() {
        await this.client.close();
        this.connected = false;
    }

    async getTargets() {
        const client = await CDP();
        const { Target } = client;
        const { targetInfos } = await Target.getTargets();
        client.close();
        return targetInfos;
    }

    async getTargetById(targetId) {
        const targets = await this.getTargets();
        console.log(targets);
        return targets.find((target) => target.targetId === targetId);
    }

    async getTargetByTitle(title) {
        const targets = await this.getTargets();
        //console.log(targets);
        return targets.find((target) => target.title.toLowerCase().includes(title.toLowerCase()));
    }

    async getTargetByUrl(url) {
        const targets = await this.getTargets();
        return targets.find((target) => target.url.toLowerCase().includes(url));
    }

    initialize() {}
}

export default ChromeProtocol;
