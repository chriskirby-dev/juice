import EventEmitter from "../Event/Emitter.mjs";
import PortalMessage from "./Message.mjs";

class Portal extends EventEmitter {
    port;
    connection;
    closed = false;
    connected = false;
    sent = [];

    constructor(port, connection) {
        super();
        this.address = crypto.randomUUID();
        this.port = port;
        this.connection = connection;
        this.initialize();
    }

    send(type, ...args) {
        const requestId = crypto.randomUUID();
        this.sent.push(requestId);
        this.port.postMessage({
            id: requestId,
            type: type,
            data: args,
            from: this.connection.name
        });
    }

    handleMessage(event) {
        const { data: message } = event;
    }

    initialize() {
        this.port.onmessageerror = (e) => {};

        this.port.onmessage = (e) => {
            const message = new PortalMessage(e);
            this.emitterScope(message);
            this.emit("message", message);
            if (this.hasListener(message.type)) {
                this.emit(message.type, ...message.data);
            }
        };

        this.port.onclose = () => {
            this.closed = true;
            this.emit("closed");
        };
    }
}

export default Portal;