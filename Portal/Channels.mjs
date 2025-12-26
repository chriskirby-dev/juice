/**
 * Portal communication channels and message management.
 * Provides classes for managing portal message queues, channels, and connections.
 * @module Portal/Channels
 */

import EventEmitter from "../Event/Emitter.mjs";
import { type } from '../Util/Core.mjs';

/**
 * MessageQueue manages a queue of portal messages for tracking sent messages and responses.
 * @class MessageQueue
 */
class MessageQueue {

    /**
     * Storage for messages by ID.
     * @type {Object.<string, PortalMessage>}
     * @static
     */
    static messages = {};

    /**
     * Adds a message to the queue.
     * @param {PortalMessage} message - The message to add
     * @static
     */
    static add(message){
        this.messages[message.id] = message;
    }

    /**
     * Checks if a message exists in the queue.
     * @param {string} messageId - The message ID to check
     * @returns {boolean} True if message exists
     * @static
     */
    static has( messageId ){
        return  this.messages[messageId] ? true : false;
    }

    /**
     * Gets a message from the queue.
     * @param {string} messageId - The message ID to retrieve
     * @returns {PortalMessage} The message
     * @static
     */
    static get(messageId){
        return  this.messages[messageId];
    }

    /**
     * Removes a message from the queue.
     * @param {string} messageId - The message ID to remove
     * @static
     */
    static remove(messageId){
        delete this.messages[messageId];
    }

    
}

/**
 * Represents a message sent through a Portal channel.
 * @class PortalMessage
 */
export class PortalMessage {

    /**
     * Checks if an event contains a portal message.
     * @param {MessageEvent} message - The message event to check
     * @returns {boolean} True if it's a portal message
     * @static
     */
    static is(message){
        return type(message.data, 'object') && message.data.hasOwnProperty('portalMessage');
    }

    /**
     * Creates a PortalMessage from a MessageEvent.
     * @param {MessageEvent} event - The message event
     * @returns {PortalMessage} The portal message
     * @static
     */
    static fromEvent(event){
        if(event instanceof MessageEvent){
            const data = event.data.data;
            const type = data.type;
            const portalMessage = new this( type, data );
            portalMessage.event = event;
            return portalMessage;
        }
    }

    _id;
    channel = 'default';


    /**
     * Creates a new PortalMessage.
     * @param {string} type - The message type
     * @param {Object} [data={}] - The message data
     * @param {Window} [target=window] - The target window
     */
    constructor( type, data={}, target=window ){
        if(type) this.type = type;
        this.data = data;
        this.target = target;
    }

    /**
     * Gets the message ID.
     * @returns {string} The message ID
     */
    get id(){
        if(this.event) return this.event.data.id;
        if(!this._id) this._id = this.channel + '-' +Math.random().toString(36).substr(2, 9);
        return this._id;
    }

    /**
     * Gets the message origin.
     * @returns {string} The origin URL
     */
    get origin(){
        return this.event?.origin;
    }

    /**
     * Gets the message source window.
     * @returns {Window} The source window
     */
    get source(){
        return this.event?.source;
    }

    /**
     * Attaches a MessagePort to this message.
     * @param {MessagePort} port - The port to attach
     */
    attach(port){
        this.attached = [port];
    }

    /**
     * Sends the message.
     * @returns {Object} Object with response() method for handling replies
     */
    send(){
        const pkg = this.package();
        console.log(pkg, this.attached);
        this.target.postMessage( pkg, '*', (this.attached || []) );
        return {
            response: ( callback ) => {
                this.responseCB = callback;
                MessageQueue.add( this );
            }
        }
    }

    /**
     * Sends a reply to this message.
     * @param {*} data - The reply data
     * @returns {*} Result of postMessage
     */
    reply( data ){
        this.data = data;
        return this.source?.postMessage( { reply: true, ...this.package() }, '*' );
    }

    /**
     * Packages the message for sending.
     * @returns {Object} The packaged message object
     */
    package(){
        const pkg = Object.create(null);
        return Object.assign(pkg, {
            id: this.id,
            type: this.type,
            data: this.data,
            time: Date.now(),
            portalMessage: true
        });
    }

    /**
     * Converts the message to a string.
     * @returns {string} JSON representation of the data
     */
    toString(){
        return JSON.stringify(this.data);
    }
}

/**
 * PortalChannel manages a communication channel for portals.
 * @class PortalChannel
 * @extends EventEmitter
 * @fires PortalChannel#connect - Emitted when connected
 * @fires PortalChannel#message - Emitted when a message is received
 */
export class PortalChannel extends EventEmitter {

    name;
    target;
    sent = [];
 
    /**
     * Creates a new PortalChannel.
     * @param {Window} [target=window] - The target window
     */
    constructor( target=window ){
        super();
        this.target = target;
        this.initialize();
    }

    /**
     * Sets the MessagePort for this channel.
     * @param {MessagePort} port - The message port
     */
    set port(port){
        this._port = port;
        this.initialize();
    }

    /**
     * Gets the MessagePort for this channel.
     * @returns {MessagePort} The message port
     */
    get port(){
        if(!this._port){
            const channel = new MessageChannel()
        }
    }

    /**
     * Generates a random ID.
     * @returns {string} A random ID string
     */
    generateId(){
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Handles incoming messages.
     */
    onMessage(){

    }

    /**
     * Establishes a connection to the target.
     */
    connect(){
        const channel = new MessageChannel()
        this.local = channel.port1;

        const connectionRequest = new PortalMessage('portal:connect', {}, this.target );
        connectionRequest.attach(channel.port2);
        this.sent.push(connectionRequest.id);
        connectionRequest.send();

        channel.port1.onmessage = (event) => {
            console.log('port message', event);
            if(type( event.data, 'object') == event.data.type == 'portal:handshake'){
                this.connected = true;
                this.emit('connect');
                return 
            }

            if( PortalMessage.is( event.data ) ){
                const message = PortalMessage.fromEvent(event);
                if( message.reply && MessageQueue.has(message.id) ){
                    MessageQueue.get(message.id).responseCB(message);
                }
                this.emit( 'message', message.channel, message );
            }

                
        }
    }

    /**
     * Sends a message through the channel.
     * @param {string} event - The event name
     * @param {*} data - The data to send
     * @returns {Object} Object with response() method for handling replies
     */
    send( event, data ){
        const message = new PortalMessage( event, data, this.target );
        this.sent.push( message.id );
        return message.send();    
    }

    /**
     * Sets up a global listener for portal messages.
     * @static
     */
    static listen(){
        
    }

    /**
     * Initializes the channel by setting up message listeners.
     * @private
     */
    initialize(){

        this.id = this.name;


        window.addEventListener('message', (event) => {
            console.log(event);
            if(PortalMessage.is(event) && event.data.type == 'portal:connect'){
                const request = PortalMessage.fromEvent(event);
                console.log(request.id, this.sent);
                if(this.sent.includes(request.id)) return console.log('sent self');
                event.stopImmediatePropagation();
                console.log(event.origin );
                const port = event.ports[0];
               // port.start();
                this.local = port;
                console.log(port);
                port.postMessage('test', '*');
                //const handshake = new PortalMessage('portal:handshake', null, port );
               // handshake.send();
                this.emit('connect');
            }
        });

    }
}

/**
 * Manages multiple portal channels.
 * @class Channels
 */
class Channels {

    /**
     * Creates a new Channels instance.
     */
    constructor(){

    }


    /**
     * Opens a new channel.
     * @param {string} name - The channel name
     * @param {Window} [target=window] - The target window
     * @returns {Channel} The created channel
     */
    open( name, target=window ){
        const channel = new Channel(name, target);
    }

    /**
     * Initializes channels by setting up message listeners.
     */
    initialize(){
        window.addEventListener('message', (event) => {
            if( event.data == 'channel' ){

            }
        });
    }
}