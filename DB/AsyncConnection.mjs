import EventEmitter from "../Event/Emitter.mjs";

class AsyncConnection extends EventEmitter {

    port = null;
    index = 0;
    async = true;
    reference = [];
    queue = [];

    constructor( port ){
        super();
        this.port = port;
        this.port.onmessage = this.message.bind(this);

        setTimeout(this.port.start, 50)
    }

    status(){
        const options = {
            command: 'getStatus',
        };
        return this.send( options );
    }

    command(cmd, ...args){
        const options = {
            command: cmd,
            args: args
        };
        return this.send( options );
    }

    insert( table, data ){
        const options = {
            command: 'insert',
            table: table,
            data: data
        };
        return this.send( options );
    }

    update( table, data, conditions ){
        const options = {
            command: 'update',
            table: table,
            data: data,
            conditions: conditions
        };
        return this.send( options );
    }

    delete( table, conditions  ){
        const options = {
            command: 'delete',
            table,
            conditions
        };
        return this.send( options );
    }

    first( table, columns, conditions, order ){
        const options = {
            command: 'first',
            table,
            columns,
            conditions
        };
        if(order) options.order = order;
        
        return this.send( options );
    }

    all( table, columns, conditions, order, limit ){
        const options = {
            command: 'first',
            table,
            columns,
            conditions
        };
        if(order) options.order = order;
        if(limit) options.limit = limit;
        
        return this.send( options );
    }

    run( statement, args ){
        const options = {
            command: 'exec',
            sql
        };
        return this.send( options );
    }

    exec( sql ){
        const options = {
            command: 'exec',
            sql
        };
        return this.send( options );
    }

    message( message ){

        const {data} = message;
        if(data == 'connected'){
            this.connected = true;
            this.emit('connected');
        }

        if(data.index !== undefined){
            const idx = this.reference.indexOf(data.index);
            const request = this.queue[idx];
            if(data.error){
                return request.reject(data.error); 
            }else{
                if(request) return request.resolve(data.response); 
            }
            this.queue.splice(idx, 1);
            this.reference.splice(idx, 1);
        }
    }

    send( options ){
        const index = this.index++;
        options.index = index;
        return new Promise( (resolve, reject) => {
            this.queue.push({ index, options: options, resolve: resolve, reject: reject });
            this.reference.push(index);
            this.port.postMessage(options);
        });
    }

    addModel(Model){
        if(!Model) return;
        Model.useDatabase(this);
        Model.async = true;
        this.models[Model.name] = Model;
    }

    addModels(Models){
        for( let model in Models ){
            this.addModel(Models[model]);
        }
    }
}

export default AsyncConnection;