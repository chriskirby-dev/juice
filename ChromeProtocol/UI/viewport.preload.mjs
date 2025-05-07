let _webContents, content;
const cdp = new EventEmitter();
import VDom from "JUICE_PATH/VirtualDom/VDom.mjs";
import { toVCode, alterVCode, resetVDom, resetComplete, state } from "JUICE_PATH/ChromeProtocol/UI//VCode.mjs";

//ipcRenderer.postMessage
let vd;

let currentTab = null;

function loadTab(name) {
    const tabPath = path.join("JUICE_PATH/", "ChromeProtocol/UI", `/tabs/${name}.mjs`);
    console.log("loadTab", tabPath);
    const loader = import(tabPath);
    loader.then((module) => {
        currentTab = module;
        console.dir(currentTab);
        if (currentTab.setup) currentTab.setup();
        else if (currentTab.start) currentTab.start();
    });
}

cdp.nav = (tab) => {
    if (tab == "fupdate") {
        return resetVDom();
    }
    loadTab(tab);
    ipcRenderer.send("debug-nav", tab);
};

let nodes = [];
let busyElement;
let rootContent = { tag: "div" };

function getNode(id) {
    let node = nodes[id];
    if (!node) {
        node = document.querySelector(`[node-id="${id}"]`);
    }
    return node;
}

function setupDomListeners() {
    ipcRenderer.on("vdom:reset", (e, data) => {
        state.busy = true;
        rootContent = data;
        content.innerHTML = "";
        const { element, index } = toVCode(data);
        console.log(element);
        content.appendChild(element);
        nodes = index;
        console.log("ROOT", data);
        resetComplete();
        state.busy = false;
    });

    ipcRenderer.on("vdom:attribute-change", alterVCode.updateAttribute);

    ipcRenderer.on("vdom:attribute-remove", alterVCode.removeAttribute);

    ipcRenderer.on("vdom:character-data", alterVCode.updateCharacterData);

    ipcRenderer.on("vdom:node-insert", alterVCode.insertBefore);

    ipcRenderer.on("vdom:node-remove", alterVCode.removeElement);

    ipcRenderer.on("vdom:child-nodes", ({ parentId, nodes }) => {
        const parent = getNode(parentId);
        if (parent) alterVCode.appendChildren(parentId, nodes);
    });
}
/*
ipcRenderer.on("load-content", (contents, target = "main") => {
    content.innerHTML = contents;
});

ipcRenderer.on("webcontents", (webContentsId) => {
    // _webContents = webContents.fromId(webContentsId);
});
*/
document.addEventListener("DOMContentLoaded", () => {
    busyElement = document.getElementById("busy");
    content = document.getElementById("content");

    setupDomListeners();

    loadTab("elements");
    window.cdp = cdp;
    ipcRenderer.send("debug-init");
});

contextBridge.exposeInMainWorld("bridge", {
    cdp: cdp,
});
