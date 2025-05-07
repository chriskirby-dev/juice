import * as url from "url";
import path from "path";
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
import { extractOptions, DEFAULT_APPLIABLE_OPTIONS } from "./BrowserOptions.mjs";
import { app, MessageChannelMain, BrowserWindow } from "electron";
import { createDelay } from "../../Util/Timers.mjs";
import Content from "../../HTML/Content.mjs";
import ChromeProtocol from "../../ChromeProtocol/ChromeProtocol.js";
const DEFAULT_HOMEPAGE = path.resolve(__dirname, "../views/default.html");
const DEFAULT_PRELOAD = path.resolve(__dirname, "../Renderer/preload.mjs");
const PLUGINS_DIR = path.resolve(__dirname, "./plugins");

export default class FluxWindow extends BrowserWindow {
    frameSize = 0;
    ipc;
    views = [];
    plugins = [];

    sessionId = "persist:default";

    static preloads = [DEFAULT_PRELOAD];
    static appliedOptionsBase = [
        "config",
        "debug",
        "isMainView",
        "dependants:depends",
        "template",
        "width",
        "height",
        "x",
        "y",
    ];
    static appliedOptions = ["cdp"];
    static instances = [];

    _width = 800;
    _height = 600;
    _x = 0;
    _y = 0;

    children = [];

    static create(options) {
        class ExtendedBrowserWindow extends FluxWindow {
            static appliedOptions = options.appliedOptions || [];
            static plugins = options.plugins || [];
        }
        return ExtendedBrowserWindow;
    }

    static async whenReady(...args) {
        return new Promise((resolve) => {
            if (app.isReady()) {
                resolve(args.length > 0 ? new this(...args) : null);
            } else {
                app.on("ready", () => {
                    resolve(args.length > 0 ? new this(...args) : null);
                });
            }
        });
    }

    constructor(name, options, parent = global.rootWindow) {
        const browserOptions = extractOptions(options);

        console.log("browserOptions", browserOptions);
        super(browserOptions);
        this.bounds = { content: {} };
        this.delay = createDelay();
        this.name = name;
        this.parent = parent;
        this.setOptions(options);
        //Add to static instances
        this.constructor.instances.push(this);
        this.#initialize(options);
    }

    /**
     * Sets the options for the FluxBrowserWindow instance.
     * Iterates over the allowedOptions and assigns values from the provided
     * options object. If an option value is not a function, it sets the
     * property; if it is a function, it calls the method with the given
     * arguments. If an option is not provided, it is set to null.
     *
     * @param {Object} options - An object containing configuration options.
     */

    setOptions(options) {
        this.options = options;
        //Apply appliedOptions from options obj to this instance if they exist

        const appliedOptions = DEFAULT_APPLIABLE_OPTIONS.concat(this.constructor.appliedOptions || []);

        for (let option of appliedOptions) {
            const optionName = option.includes(":") ? option.split(":")[0] : option;
            const optionKeys = option.includes(":") ? option.split(":")[1].split(",") : [option];
            const optionKey = optionKeys.filter((k) => options[k] !== undefined)[0];

            if (options[optionKey] !== undefined) {
                if (typeof this[optionName] !== "function") {
                    this[optionName] = options[optionKey];
                } else {
                    this[optionName](...options[optionKey]);
                }
            } else if (this[optionName] === undefined) {
                this[optionName] = null;
            }
        }
    }

    get address() {
        return this.address;
    }

    get static() {
        return this.constructor;
    }

    get title() {
        return this.webContents.getTitle();
    }

    get url() {
        return this.webContents.getURL();
    }

    get x() {
        return this._x;
    }

    set x(x) {
        this._x = x - this.frameSize;
        this.delay(10, "bounds").then(() => this.setPosition(this._x, this._y));
    }

    get y() {
        return this._y;
    }

    set y(y) {
        this._y = y - this.frameSize;
        this.delay(10, "bounds").then(() => this.setPosition(this._x, this._y));
    }

    get width() {
        return this._width;
    }

    set width(width) {
        this._width = width + this.frameSize * 2;
        this.delay(10, "bounds").then(() => this.setSize(this._width, this._height));
    }

    get height() {
        return this._height;
    }

    set height(height) {
        this._height = height + this.frameSize * 2;
        this.delay(10, "bounds").then(() => this.setSize(this._width, this._height));
    }

    windowChange({ x = this._x, y = this._y, width = this._width, height = this._height } = {}) {
        console.log("windowChange", { x, y, width, height });
        this.bounds = { x, y, width, height };
        this.emit("window-change", this.bounds);
    }

    async loadTemplate(path, tokens) {
        const dir = path.substring(0, Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")));
        const content = new Content(path, { tokens });
        await content.loaded();
        console.log("Load Template", content.rendered);
        this.loadURL("data:text/html;charset=UTF-8," + encodeURIComponent(content.rendered), {
            baseURLForDataURL: dir,
        });
    }

    send() {
        return this.webContents.send(...arguments);
    }

    sendPortal(port, channel) {
        this.webContents.postMessage("portal:forward", { channel: channel }, [port]);
    }

    #domReady() {
        const { config } = this;
        this.#onFrameCreated(null, this.webContents.mainFrame);
        if (config) {
            if (config.scripts) {
                config.scripts.forEach((script) => {
                    this.injectScript(script);
                });
            }
        }
    }

    #onFrameCreated(e, details) {
        const { frame } = details;

        const identifiers = {
            nodeId: frame.frameTreeNodeId,
            routingId: frame.routingId,
            processId: frame.processId,
            name: frame.name,
            orgin: frame.origin,
            webContentsId: this.webContents.id,
            scope: "viewport",
        };

        setTimeout(() => frame.send("identifiers", identifiers), 100);
    }

    #onMove() {
        const [x, y] = this.getPosition();
        const { menubar, frameSize } = this.bounds;
        this.bounds.x = x;
        this.bounds.y = y;
        if (!this.bounds.content) this.bounds.content = {};
        this.bounds.content.x = x + frameSize;
        this.bounds.content.y = y + menubar.height;
        if (this.views && this.views.length) {
            this.views.forEach((view) => view.onWindowMove(this.bounds));
        }
    }

    #onResize() {
        // console.log("RESIZE", this.views);
        const [totalWidth, totalHeight] = this.getSize();
        const [width, height] = this.getContentSize();
        this.bounds.height = totalHeight;
        this.bounds.width = totalWidth;
        this.bounds.content.width = width;
        this.bounds.content.height = height;
        if (this.views && this.views) {
            for (let view in this.views) this.views[view].onWindowResize(this.bounds);
        }
    }

    inject(js) {
        this.webContents.executeJavaScript(`
                (function(){
                    ${js}
                })()
            `);
    }

    injectJSRecursively(script, gesture = false, callback) {
        this.frames.forEach((frame, i) => {
            let inject = typeof script == "function" ? script(frame, i) : script;
            frame.executeJavaScript(inject, gesture).then((resp) => {
                if (callback) callback(frame, resp);
                return resp;
            });
        });
    }

    injectScript(source, target) {
        const ext = path.extname(source);
        switch (ext) {
            case ".js":
                return this.injectPromise(`
                    alert('inject ${source}');
                    const script = document.createElement('script');
                    script.src = "${source}";
                    script.onload = () => resolve();
                    script.onerror = () => reject();
                    document.head.appendChild(script);
                `);
                break;
            case ".css":
                return this.injectPromise(`
                    alert('inject ${source}');
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = "${source}";
                    link.onload = () => resolve();
                    link.onerror = () => reject();
                    document.head.appendChild(link);
                `);
                break;
        }
    }

    injectPromise(js) {
        if (!js.includes("resolve")) {
            console.warn("injectPromise: missing resolve");
        }
        this.webContents.executeJavaScript(`
                (function(){
                    return new Promise( (resolve, reject) => {
                        ${js}
                    });
                })()
            `);
    }

    async loadPlugin(pluginName) {
        const pluginPath =
            pluginName.startsWith("/") ||
            pluginName.startsWith("\\") ||
            pluginName.startsWith("http") ||
            pluginName.startsWith("file:")
                ? pluginName
                : "file://" + path.resolve(PLUGINS_DIR, pluginName + ".mjs");
        console.log(pluginPath);
        const plugin = await import(pluginPath);
        console.log(plugin);
        if (plugin.install) plugin.install(this);
        console.log("Installed Plugin", pluginName);
        this.plugins.push(plugin);
    }

    loadFile(path, options) {
        return this.webContents.loadURL(path, options);
    }

    loadURL(url, options) {
        if (!url.startsWith("http")) url = "http://" + url;
        return this.webContents.loadURL(url, options);
    }

    /*************  ✨ Codeium Command ⭐  *************/
    /**
     * Opens a Chrome Protocol DevTools window for this view.
     *
     * Automatically starts the Chrome Protocol if it is not already running.
     *
     * @returns {undefined}
     */
    /******  c8f8d478-cca2-486f-b560-0c5672ce12f1  *******/
    async openChromeProtocol() {
        console.log("openChromeProtocol");
        return this.startChromeProtocol(true);
    }

    async startChromeProtocol(open = false) {
        await FluxBaseView.whenReady();
        console.log("startChromeProtocol");
        if (!this.chromeProtocol) this.chromeProtocol = new ChromeProtocol(this.webContents);

        return new Promise((resolve) => {
            this.chromeProtocol.on("connect", (client) => {
                console.log("Recieved Connect Event");
                const chromeProtocol = this.chromeProtocol;
                if (open) chromeProtocol.open();
                else resolve(chromeProtocol);
            });
        });
    }

    #initialize() {
        console.log("#init", this.constructor.name);
        this.windowChange = this.windowChange.bind(this);
        const { options, parent } = this;
        const [totalWidth, totalHeight] = this.getSize();
        const [width, height] = this.getContentSize();

        console.log(totalWidth, totalHeight, width, height);

        const frameSize = (totalWidth - width) / 2;
        this.bounds = {
            window: {},
            content: { width },
            frameSize: frameSize,
            menubar: { height: totalHeight - height - frameSize },
            width: width,
        };

        this.bounds.content.height = totalHeight - this.bounds.menubar.height;

        if (this.template) {
            this.loadTemplate(this.template, this.tokens || {});
        }

        if (this.static.plugins?.length) {
            this.static.plugins.forEach((plugin) => {
                this.loadPlugin(plugin);
            });
        }

        this.webContents.mainFrame.ipc.on("portal-created", () => {});

        this.webContents.on("ipc-message", (e, channel, ...data) => {
            console.log("ipc-message", channel, data);
            if (e.ports) {
                const port = e.ports[0];
            }
            if (channel == "preloaded") {
                this.emit("preloaded");
            }
            if (channel == "portal") {
                const port = e.ports[0];
                port.on("message", (event) => {
                    // data is { answer: 42 }
                    const data = event.data;
                });
                port.start();
                this.emit("portal", port);
            }

            this.emit(`ipc:${channel}`, e, ...data);
        });

        this.#onResize();

        this.#onMove();

        this.on("dom-ready", this.#domReady.bind(this));

        this.on("move", this.#onMove.bind(this));

        this.on("resize", this.#onResize.bind(this));

        this.on("close", () => {});

        this.webContents.on("did-finish-load", () => {
            this.#onFrameCreated(null, { frame: this.webContents.mainFrame });
            this.windowChange({});
            this.emit("loaded");
        });

        this.webContents.on("frame-created", this.#onFrameCreated.bind(this));

        if (this.initialize) this.initialize();

        this.loadFile(this.static.homepage || DEFAULT_HOMEPAGE).then(() => {
            this.emit("ready");
            if (this.debug) {
                this.webContents.openDevTools({ mode: "detach" });
            }
        });
    }
}
