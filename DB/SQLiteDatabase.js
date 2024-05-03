import BetterSQLite3 from 'better-sqlite3';

import Database from './Database';
import { SQL, SQLStatement } from './SQL';
global.debug = console.log;

class SQLiteDatabase extends Database {

    source = null;

    models = {};

    constructor( path, options ){
        super(new BetterSQLite3( path, options ));

        this.initialize();
    }

    hasTable(table){
        const exists = this.db.run( `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`, [table] );
        return exists.run();
    }

    createTable( table, fields ){
        return this.db.exec( `CREATE TABLE IF NOT EXISTS ${table} ( ${Object.keys(fields).map(f => `${f} ${fields[f]}`)} )` );
    }


    insert( table, data ){
        const cmd = SQL.insert( table, data );
        return this.db.prepare( cmd.statement ).run( cmd.args );
    }

    insertAll(){
        
    }

    first( table, columns, conditions ){
        const cmd = SQL.select( table, columns, conditions );
        debug(cmd);
        return this.db.prepare( cmd.statement ).get( ...cmd.args );
    }

    all( table, columns, conditions, order, limit, offset ){
        const cmd = new SQLStatement().select(table, columns, conditions).order(order).limit(limit).compile();
        debug(cmd);
        return this.db.prepare( cmd.statement ).all( ...cmd.args );
    }

    update(table, data, conditions){
        const cmd = SQL.update(table, data, conditions);
        return this.db.prepare( cmd.statement ).run( ...cmd.args );
    }

    updateAll(){
        const cmd = new SQLStatement().update(table, columns, conditions).order(order).limit(limit);
        return this.db.prepare( cmd.statement ).get( ...cmd.args );
    }

    delete(){
        const cmd = new SQLStatement().delete(table, conditions);
        return this.db.prepare( cmd.statement ).run( ...cmd.args );
    }

    addModel(Model){
        if(!Model) return;
        Model.db = this;
        const tableName = Model.tableName;
        const schema = Model.schema;
        debug(schema);
        const fields = {};
        for (const field in schema){
            const definition = [schema[field].type.toUpperCase()];
            if(schema[field].primaryKey) definition.push('PRIMARY KEY');
            if(schema[field].unique) definition.push('UNIQUE');
            if(schema[field].autoIncrement) definition.push('AUTOINCREMENT');
            if(schema[field].null) definition.push('NULL');
            if(schema[field].required) definition.push('NOT NULL');
            if(schema[field].default) definition.push(`DEFAULT ${schema[field].default}`);
            fields[field] = definition.join(' ');
        }
        debug(tableName, fields);
        const create = this.createTable( tableName, fields );
        debug('CREATE', create);

        this.models[Model.name] = Model;
    }

    tableInfo( tableName ){
        return this.db.pragma(`table_info(${tableName})`);
    }

    getTables(){
        const internal = ['sqlite_sequence','sqlite_schema','sqlite_temp_schema'];
        const tbl_list = this.db.pragma(`table_list`);
        const tables = tbl_list.filter( tbl => !internal.includes(tbl.name) );
        const resp = {};
        for(let i=0;i<tables.length;i++){
            resp[tables[i].name] = tables[i];
        }
        return resp;
    }

    initialize(){
        const tables = this.getTables();
        for( let tableName in tables ){
            const table = tables[tableName];
            const tbl = this.tableInfo( table.name );
            const columns = {};
            for( let column of tbl ){
                columns[column.name] = column;
            }
            table.columns = columns;
        }
        this.schema = tables;
        debug('DB Schema', this.schema);
    }

}

export default SQLiteDatabase;