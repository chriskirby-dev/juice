/**
 * PortalMessage represents a message sent through a Portal communication channel.
 * Wraps MessageEvent data and provides methods for replying to messages.
 * @module Portal/Message
 */

/**
 * PortalMessage wraps a MessageEvent for Portal communication.
 * Provides structured access to message data and reply functionality.
 * @class PortalMessage
 * @example
 * // In a message listener:
 * portal.on('message', (msg) => {
 *   console.log(msg.data);
 *   msg.reply('response data');
 * });
 */
class PortalMessage {
    /**
     * The original message data.
     * @type {*}
     */
    message;
    
    /**
     * Creates a new PortalMessage from a MessageEvent.
     * @param {MessageEvent} event - The MessageEvent to wrap
     */
    constructor(event) {
        this.event = event;
        this.message = event.data;
    }

    /**
     * Gets the message ID.
     * @returns {*} The message ID
     */
    get id(){
        return this.message.id;
    }

    /**
     * Gets the message data payload.
     * @returns {*} The message data
     */
    get data() {
        return this.message.data;
    }

    /**
     * Gets the message type.
     * @returns {string} The message type
     */
    get type() {
        return this.message.type;
    }

    /**
     * Sends a reply back to the message source.
     * @param {...*} args - Arguments to send as reply data
     */
    reply( ...args ) {
        this.event.source.postMessage({
            portalMessage: true,
            id: this.id,
            type: this.type,
            data: args,
            reply: true
        });
    }

    /**
     * Returns the string representation of the message.
     * @returns {string} The message as a string
     */
    toString() {
        return this.message;
    }


}


export default PortalMessage;