/**
 * Portal class for bidirectional message-based communication over MessagePort.
 * Provides event-driven messaging with automatic message handling and lifecycle management.
 * @module Portal/Portal
 */

import EventEmitter from "../Event/Emitter.mjs";
import PortalMessage from "./Message.mjs";

/**
 * Represents a bidirectional communication portal using MessagePort.
 * Handles message sending, receiving, and event dispatching.
 * @class Portal
 * @extends EventEmitter
 * @param {MessagePort} port - The MessagePort for communication
 * @param {PortalConnection} connection - The parent connection
 * @fires Portal#message When a message is received
 * @fires Portal#closed When the portal is closed
 * @example
 * const portal = new Portal(messagePort, connection);
 * portal.on('custom-event', (data) => {
 *   console.log('Received:', data);
 * });
 * portal.send('custom-event', { hello: 'world' });
 */
class Portal extends EventEmitter {
    /** @type {MessagePort} The underlying message port */
    port;
    /** @type {PortalConnection} Parent connection */
    connection;
    /** @type {boolean} Whether the portal is closed */
    closed = false;
    /** @type {boolean} Whether the portal is connected */
    connected = false;
    /** @type {Array<string>} IDs of sent messages */
    sent = [];
    /** @type {string} Unique address for this portal */
    address;

    /**
     * Creates a new Portal instance.
     * @param {MessagePort} port - The MessagePort for communication
     * @param {PortalConnection} connection - The parent connection
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
     * @example
     * portal.send('data-update', { value: 42 });
     * portal.send('request', 'user', 123);
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
     * @private
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