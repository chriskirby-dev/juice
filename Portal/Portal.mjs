/**
 * Portal provides cross-context communication using MessageChannel API.
 * Enables secure message passing between different browser contexts (windows, iframes, workers).
 * @module Portal/Portal
 */

import EventEmitter from "../Event/Emitter.mjs";
import PortalMessage from "./Message.mjs";

/**
 * Portal class for managing message channel communication.
 * @class Portal
 * @extends EventEmitter
 * @fires Portal#message - Emitted when a message is received
 * @fires Portal#closed - Emitted when the portal is closed
 */
class Portal extends EventEmitter {
    port;
    connection;
    closed = false;
    connected = false;
    sent = [];

    /**
     * Creates a new Portal instance.
     * @param {MessagePort} port - The MessagePort for communication
     * @param {Object} connection - The PortalConnection that owns this portal
     */
    constructor(port, connection) {
        super();
        this.address = crypto.randomUUID();
        this.port = port;
        this.connection = connection;
        this.initialize();
    }

    /**
     * Sends a message through the portal.
     * @param {string} type - The message type
     * @param {...*} args - Additional data to send with the message
     */
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

    /**
     * Handles incoming messages.
     * @param {MessageEvent} event - The message event
     */
    handleMessage(event) {
        const { data: message } = event;
    }

    /**
     * Initializes the portal by setting up message and error handlers.
     * @private
     */
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
