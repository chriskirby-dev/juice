import { BaseWindow, WebContentsView } from "electron";
import ElectronView from "./ElectronView.js";

const DEFAULT_HOMEPAGE = "about:blank";

class ElectronWindow extends BaseWindow {
    static instances = [];
    // static preload = null;
    //static homepage;
    homepage;
    options;
    views = [];

    static prepareOptions(options) {
        if (this.preload) {
            options.webPreferences = {
                preload: this.preload,
            };
        }
        return options;
    }

    constructor(options = {}) {
        super(ElectronWindow.prepareOptions(options));
        // debug(options);
        this.constructor.instances.push(this);
        setTimeout(() => this.#initialize(), 0);
    }

    get title() {
        return this.getTitle();
    }

    set title(value) {
        this.setTitle(value);
    }

    get url() {
        return this.getURL();
    }

    set url(value) {
        this.loadURL(value);
    }

    send() {
        return this.webContents.send(...arguments);
    }

    addBrowserView(view) {
        view.window = this;
        this.views.push(view);
        super.addBrowserView(view);
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
            webContentsId: this.getContentView().id,
            scope: "viewport",
        };

        setTimeout(() => {
            frame.send("identifiers", identifiers);
        }, 100);
    }

    #onMove() {
        const [x, y] = this.getPosition();
        const { menubar, frameSize } = this.bounds;
        this.bounds.x = x;
        this.bounds.y = y;
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

    injectScript(source) {
        this.webContents.executeJavaScript(`
            (function(){
                alert('inject');
                const script = document.createElement('script');
                script.src = "${source}"
                document.head.appendChild(script);
            })()
        `);
    }

    loadURL(url, options) {
        this.views.viewport.webContents.loadURL(url, options);
    }

    addContentView(id, options, bounds = { x: 0, y: 0, width: this.bounds.width, height: this.bounds.height }) {
        const view = new ElectronView(id, this, options);
        view.setBackgroundColor("red");
        view.setBounds(bounds);
        this.contentView.addChildView(view);
        view.webContents.loadFile(this.homepage || DEFAULT_HOMEPAGE);
        this.views[id] = view;
        this.webContents = view.webContents;

        this.#onFrameCreated(null, { frame: this.views[id].webContents.mainFrame });

        view.webContents.on("ipc-message", (e, channel, ...data) => {
            if (e.ports) {
                const port = e.ports[0];
            }
            if (channel == "portal") {
                const port = e.ports[0];
                port.on("message", (event) => {
                    // data is { answer: 42 }
                    const data = event.data;
                });
                port.start();
                this.emit("portal", port);
                return;
            }
            this.emit(`ipc:${id}`, channel, e, ...data);
        });

        return view;
    }

    #initialize(options) {
        const [totalWidth, totalHeight] = this.getSize();
        const [width, height] = this.getContentSize();

        console.log(totalWidth, totalHeight, width, height);

        const frameSize = (totalWidth - width) / 2;
        const menuBarHeight = totalHeight - height - frameSize;

        this.bounds = {
            frameSize: frameSize,
            menubar: menuBarHeight,
            width: width,
            height: totalHeight - menuBarHeight,
            content: {
                x: 0,
                y: menuBarHeight,
                width: width,
                height: height,
            },
        };

        const view = this.addContentView(
            "viewport",
            {
                webPreferences: {
                    nodeIntegration: true,
                    preload: this.preload,
                },
            },
            this.bounds.content
        );

        this.setContentView(view);

        this.#onResize();

        this.#onMove();

        this.getContentView().on("frame-created", this.#onFrameCreated.bind(this));

        this.on("dom-ready", this.#domReady.bind(this));

        this.on("move", this.#onMove.bind(this));

        this.on("resize", this.#onResize.bind(this));

        if (this.debug) view.webContents.openDevTools({ mode: "detach" });

        // this.loadFile(this.constructor.homepage || DEFAULT_HOMEPAGE);
        if (this.initialiize) this.initialize(options);
    }
}

export default ElectronWindow;
