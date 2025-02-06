import { ipcRenderer } from "electron";
//import { webContents } from "electron";
let _webContents, content;
//ipcRenderer.postMessage

function setupDom() {
    ipcRenderer.on("vdom:reset", (root) => {
        console.log("reset", root);
        content.innerHTML = JSON.strinigify(root);
    });

    ipcRenderer.on("vdom:attribute-change", ({ nodeId, name, value }) => {
        console.log("attribute-change", nodeId, name, value);
    });

    ipcRenderer.on("vdom:attribute-remove", ({ nodeId, name }) => {
        console.log("attribute-remove", nodeId, name);
    });

    ipcRenderer.on("vdom:character-data", ({ nodeId, characterData }) => {
        console.log("character-data", nodeId, characterData);
    });

    ipcRenderer.on("vdom:node-insert", ({ parentNodeId, previousNodeId, node }) => {
        console.log("node-insert", parentNodeId, previousNodeId, node);
    });

    ipcRenderer.on("vdom:node-remove", ({ parentNodeId, nodeId }) => {
        console.log("node-remove", parentNodeId, nodeId);
    });

    ipcRenderer.on("vdom:child-nodes", ({ parentId, nodes }) => {
        console.log("child-nodes", parentId, nodes);
    });

    console.log("setupDom DONE");
}
function initialize() {
    setupDom();
}

ipcRenderer.send("debug-init");

ipcRenderer.on("webcontents", (webContentsId) => {
    // _webContents = webContents.fromId(webContentsId);
});

document.addEventListener("DOMContentLoaded", () => {
    content = document.getElementById("content");
    initialize();
});
