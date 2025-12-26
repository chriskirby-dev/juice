import EventEmitter from "../Event/Emitter.mjs";
import Portal from "./Portal.mjs";
import PortalMessage from "./Message.mjs";
import { type, empty } from "../Util/Core.mjs";

class Connection extends EventEmitter {
    local;
    remote;
    port;

    constructor(port, remote, local) {}
}

export class PortalConnection extends EventEmitter {
    address;
    name;
    connections = [];
    sent = [];
    options = {};
    hooks = {};

    constructor(name, options = {}) {
        super();
        this.name = name;
        this.options = options;
        console.log("PortalConnection", name, options);
        this.address = crypto.randomUUID();
        this.onMessage = this.onMessage.bind(this);
        this.initialize();
    }

    hook(action, fn) {
        if (fn) {
            this.hooks[action] = fn;
        } else {
            return this.hooks[action];
        }
    }

    connect(target = window) {
        const channel = new MessageChannel();
        const localPort = channel.port1;
        const remotePort = channel.port2;

        localPort.onmessage = (e) => {
            const message = e.data;
            console.log(message);
            if (message.type === "portal:handshake") {
                localPort.postMessage({
                    id: message.id,
                    type: "portal:connected",
                    from: this.name
                });
                const portal = new Portal(localPort, this);
                portal.to = message.from;
                this.emit("connect", portal, localPort);
            }
        };

        const requestId = Math.random().toString(36).substring(2, 9);
        const message = {
            id: requestId,
            from: this.name,
            type: "portal:connect"
        };

        this.sent.push(message.id);
        target.postMessage(message, this.options.origin || "*", [remotePort]);
    }

    identity() {
        return {
            time: Date.now(),
            address: this.address,
            name: this.name
        };
    }

    storeActivePortals() {
        localStorage.setItem("portal:connections", JSON.stringify(this.connections));
    }

    onPortalRequest(port, request) {
        console.log("portal request", request);

        let remoteIdentity, connected;

        port.onmessage = (e) => {
            console.log("PORTAL MESSAGE", e.data.id, e);
            const message = e.data;
            const command = type(message, "string") ? message : message.type;
            if (!command) return;
            console.log(command, message);
            if (command.startsWith("portal:")) {
                switch (command) {
                    case "portal:handshake":
                        //Portal Handshake
                        remoteIdentity = message;
                        console.log("remoteIdentity recieved", remoteIdentity);
                        port.postMessage({ id: message.id, type: "portal:connect" });
                        break;
                    case "portal:connect":
                        //Portal Connect
                        if (remoteIdentity) {
                            const portal = new Portal(port, remoteIdentity);
                            portal.authenticated = true;
                            this.connections.push(portal);
                            this.storeActivePortals();
                            console.log("portal connected");
                            this.emit("connect", portal);
                        }
                        break;
                    case "portal:reject":
                        port.close();
                        break;
                    default:
                        //Portal Message
                        this.emit("message", message);
                        this.emit(message.type, ...message.data);
                }
            } else {
                console.log("emit message");
                this.emit("message", message);
                this.emit(message.type, ...message.data);
            }
        };

        port.onclose = () => {
            console.log("portal closed");
            this.connections = this.connections.filter((c) => {
                return c.port != port;
            });
            this.storeActivePortals();
            this.emit("close", port);
        };

        // const rid = Math.random().toString(36).substring(2, 9);
        const response = {
            id: this.name + "-" + request.id,
            from: this.identity(),
            type: "portal:handshake"
        };
        this.sent.push(response.id);
        port.postMessage(response);

        return;
    }

    onMessage(event, message) {
        console.log("Portal Message", event, message);
        const command = type(message, "string") ? message : message.type;
        console.log(command);
        if (type(message, "string") && command == "portal:request") {
            message = { id: "999", type: command };
        }
        if (command && command == "portal:request") return this.onPortalRequest(event.ports[0], message);

        this.emit("message", event, message);
    }

    initialize() {
        console.log("initialize native");
        const connections = JSON.parse(localStorage.getItem("portal:connections"));

        window.addEventListener("message", (e) => {
            console.log("native req", e);
            const message = e.data;
            return this.onMessage(e, message);
        });
    }
}

export class ElectronPortalConnection extends PortalConnection {
    initialize() {
        console.log("initialize electron");
        const { ipcRenderer } = require("electron");
        ipcRenderer.on("portal:forward", (event, message = {}) => {
            console.log(
                "electron portal forward",
                "-->",
                message.channel ? message.channel : "portal:request",
                window.location.href
            );
            return window.postMessage(message.channel ? message.channel : "portal:request", "*", [event.ports[0]]);
        });
        ipcRenderer.on("portal:request", (event, message) => {
            if (this.options.portForward) return window.postMessage("portal:request", "*", [event.ports[0]]);
            // console.log('electron req', event, message);
            if (event.ports[0]) return this.onPortalRequest(event.ports[0], { id: "999" });
        });
        window.addEventListener("message", (e) => {
            if (e.data.type == "forward:ipc") {
                const hook = this.hook("forward:ipc");
                if (hook) hook(e.data);
                console.log("Forwarding to ipc renderer", e.data.channel, e.data.data, e.ports);
                if (e.ports && e.ports.length) {
                    ipcRenderer.postMessage(e.data.channel, e.data.message, e.ports);
                } else {
                    ipcRenderer.send(e.data.channel, e.data.message);
                }
            }
        });
    }
}

export default PortalConnection;