import EventEmitter from "../Event/Emitter.mjs";

class Database extends EventEmitter {
    
    models = {};
    tables = {};

    constructor(db){
        super();
        this.db = db;
        this.initialize();
    }
    
    model(name){
        return this.models[name];
    }

    modelByTable( tableName ){
        return this.tables[tableName].model;
    }

    deleted( table, records ){
        const Model = this.modelByTable(table);
        Model.emit('deleted', records);
    }

    created( table, records ){
        const Model = this.modelByTable(table);
        Model.emit('created', records);
    }

    updated( table, records ){
        const Model = this.modelByTable(table);
        Model.emit('updated', records);
    }

    hasTable(table){
      
    }

    createTable( table, fields ){

    }


    insert(){

    }

    insertAll(){

    }

    get(){

    }

    getAll(){

    }

    update(){

    }

    updateAll(){

    }

    delete(){

    }

    addModel(Model){

    }

    model(name){
        return this.models[name];
    }

   

}


export default Database;