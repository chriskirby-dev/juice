import * as url from "url";
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
import path from "node:path";

import ElectronWindow from "../../Electron/Base/ElectronWindow.js";

class ChromeDebugWindow extends ElectronWindow {
    debug = true;

    constructor(cdp) {
        super({
            width: 800,
            height: 600,
            // autoHideMenuBar: true,
            enableRemoteModule: true,
        });
        this.preload = path.resolve(__dirname, "viewport.preload.mjs");
        this.homepage = path.resolve(__dirname, "debug.html");
        this.cdp = cdp;
    }

    initialize() {
        const { vdom, webContents, ui } = this.cdp;

        vdom.on("update", (action, data) => {
            debug("UPDATE", acton, data);
            ui.webContents.send(`vdom:${action}`, data);
        });

        vdom.on(`ipc:viewport`, (channel, e, ...data) => {
            switch (channel) {
                case "debug-init":
                    break;
            }
        });
    }
}

export default ChromeDebugWindow;
