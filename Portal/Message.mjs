class PortalMessage {
    message;
    constructor(event) {
        this.event = event;
        this.message = event.data;
    }

    get id(){
        return this.message.id;
    }

    get data() {
        return this.message.data;
    }

    get type() {
        return this.message.type;
    }

    reply( ...args ) {
        this.event.source.postMessage({
            portalMessage: true,
            id: this.id,
            type: this.type,
            data: args,
            reply: true
        });
    }

    toString() {
        return this.message;
    }


}


export default PortalMessage;