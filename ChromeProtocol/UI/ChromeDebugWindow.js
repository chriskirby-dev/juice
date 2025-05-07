import * as url from "url";
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
import path from "node:path";

import FluxWindow from "../../Electron/Base/FluxWindow.mjs";

class ChromeDebugWindow extends FluxWindow {
    debug = true;

    static appliedOptions = ["cdp"];

    static homepage = path.resolve(__dirname, "debug.html");

    constructor(cdp, target) {
        super(
            "debugview",
            {
                title: "Debugger",
                cdp: cdp,
                debug: true,
                width: 800,
                height: 600,
                webPreferences: {
                    contextIsolation: true,
                    preload: path.resolve(__dirname, "viewport.preload.mjs"),
                },
            },
            global.rootWindow
        );

        this.cdp = cdp;
    }

    setTarget(target) {
        console.log("setTarget", target);
        this.target = target;
        return this.target;
    }

    async initialize() {
        const { cdp, webContents } = this;
        const { vdom } = cdp;

        const target = this.setTarget(cdp.getTarget());

        await vdom.isReady();

        webContents.on("icp:vdom:reset", () => {
            vdom.reset();
        });

        cdp.webContents.on("did-finish-load", () => {
            vdom.reset();
        });

        vdom.on("update", async (action, data) => {
            if (!webContents.isDestroyed() && webContents.mainFrame) {
                const frame = webContents.mainFrame;
                switch (action) {
                    case "reset":
                        const tree = await vdom.rootNode.toObject();
                        data = tree;
                        break;
                }
                console.log("UPDATE", action, data);
                webContents.send(`vdom:${action}`, data);
            }
        });
        /*
        this.on(`ipc:vdom:reset`, async (channel, e, ...data) => {
            const tree = await vdom.rootNode.toObject();
            webContents.send(`vdom:reset`, tree);
            return;
        });
*/
        this.on(`ipc:debug-init`, async (channel, e, ...data) => {
            if (!vdom.rootNode) return vdom.reset();
            const tree = await vdom.rootNode.toObject();
            webContents.send(`vdom:reset`, tree);
            return;
        });

        this.on(`ipc:viewport`, (channel, e, ...data) => {
            switch (channel) {
                case "debug-init":
                    break;
            }
        });
    }
}

export default ChromeDebugWindow;
