import EventEmitter from "../Event/Emitter.mjs";
import { type } from '../Util/Core.mjs';

class MessageQueue {

    static messages = {};

    static add(message){
        this.messages[message.id] = message;
    }

    static has( messageId ){
        return  this.messages[messageId] ? true : false;
    }

    static get(messageId){
        return  this.messages[messageId];
    }

    static remove(messageId){
        delete this.messages[messageId];
    }

    
}

export class PortalMessage {

    static is(message){
        return type(message.data, 'object') && message.data.hasOwnProperty('portalMessage');
    }

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


    constructor( type, data={}, target=window ){
        if(type) this.type = type;
        this.data = data;
        this.target = target;
    }

    get id(){
        if(this.event) return this.event.data.id;
        if(!this._id) this._id = this.channel + '-' +Math.random().toString(36).substr(2, 9);
        return this._id;
    }

    get origin(){
        return this.event?.origin;
    }

    get source(){
        return this.event?.source;
    }

    attach(port){
        this.attached = [port];
    }

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

    reply( data ){
        this.data = data;
        return this.source?.postMessage( { reply: true, ...this.package() }, '*' );
    }

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

    toString(){
        return JSON.stringify(this.data);
    }
}

export class PortalChannel extends EventEmitter {

    name;
    target;
    sent = [];
 
    constructor( target=window ){
        super();
        this.target = target;
        this.initialize();
    }

    set port(port){
        this._port = port;
        this.initialize();
    }

    get port(){
        if(!this._port){
            const channel = new MessageChannel()
        }
    }

    generateId(){
        return Math.random().toString(36).substr(2, 9);
    }

    onMessage(){

    }

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

    /*
    * channel.send();
    */

    send( event, data ){
        const message = new PortalMessage( event, data, this.target );
        this.sent.push( message.id );
        return message.send();    
    }

    static listen(){
        
    }

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

class Channels {

    constructor(){

    }


    open( name, target=window ){
        const channel = new Channel(name, target);
    }

    initialize(){
        window.addEventListener('message', (event) => {
            if( event.data == 'channel' ){

            }
        });
    }
}