import BetterSQLite3 from 'better-sqlite3';
import { STORAGE_TYPES, TYPE_ALIASES } from './Constants.mjs'

import Database from '../Database.js';
import { SQL, SQLStatement } from '../SQL.js';


class SQLiteDatabase extends Database {

    source = null;

    

    constructor( path, options ){
        super(new BetterSQLite3( path, options ));

    }

    command( method, statement, args ){

    }

    hasTable(table){
        this.command();
        const exists = this.command( 'run', `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`, [table] ).then();
        return exists.run();
    }

    createTable( table, fields ){
        return this.db.exec( `CREATE TABLE IF NOT EXISTS ${table} ( ${Object.keys(fields).map(f => `${f} ${fields[f]}`)} )` );
    }


    insert( table, data ){
        const cmd = SQL.insert( table, data );
        return Promise.resolve( this.db.prepare( cmd.statement ).run( cmd.args ) );
    }

    insertAll(table, list){
        const cmd = SQL.insert( table, list[0] );
        newRecord = this.db.prepare( cmd.statement );
        this.db.transaction((item) => {
            newRecord(Object.values( item ));
        })(list);
    }

    first( table, columns, conditions ){
        const cmd = SQL.select( table, columns, conditions );
       // debug(cmd);
        return  Promise.resolve( this.db.prepare( cmd.statement ).get( ...cmd.args ) );
    }

    all( table, columns, conditions, order, limit, offset ){
        const cmd = new SQLStatement().select(table, columns, conditions).order(order).limit(limit).compile();
       // debug(cmd);
        return  Promise.resolve( this.db.prepare( cmd.statement ).all( ...cmd.args ) );
    }

    update(table, data, conditions){
        const cmd = SQL.update(table, data, conditions);
        return  Promise.resolve( this.db.prepare( cmd.statement ).run( ...cmd.args ) );
    }

    updateAll(table, data, conditions){
        const cmd = new SQLStatement().update(table, data, conditions);
        return  Promise.resolve( this.db.prepare( cmd.statement ).get( ...cmd.args ) );
    }

    delete( table, conditions ){
        const cmd = SQL.delete(table, conditions);
        return  Promise.resolve( this.db.prepare( cmd.statement ).run( cmd.args ) );
    }

    count( table, conditions ){
        const cmd = SQL.count(table, conditions);
       // console.log(cmd);
        return  Promise.resolve( this.db.prepare( cmd.statement ).get( ...cmd.args ).COUNT );
    }

    max( table, column, conditions ){
        const cmd = SQL.max(table, column, conditions);
        return  Promise.resolve( this.db.prepare( cmd.statement ).get( ...cmd.args ).MAX );
    }

    addModel(Model){
        if(!Model) return;
        Model.db = this;
        const tableName = Model.tableName;
        const schema = Model.schema;
        const tableSchema = this.schema[tableName];
        
        if(!tableSchema){
            const fields = {};
            if(Model.timestamps){
                schema.updated_at = { type: 'datetime', null: true  };
                schema.created_at = { type: 'datetime' };
                schema.deleted_at = { type: 'datetime', null: true };
            }
            for (const field in schema){
                let type = schema[field].type.toUpperCase();
                if(type == 'SET') type = 'TEXT';
                if( STORAGE_TYPES.includes(type) ){

                }
                const definition = [type];
                if(schema[field].maxLength) definition[0] += `(${schema[field].maxLength})`;
                if(schema[field].primaryKey) definition.push('PRIMARY KEY');
                if(schema[field].autoIncrement) definition.push('AUTOINCREMENT');
                if(schema[field].unique) definition.push('UNIQUE');
                if(schema[field].null) definition.push('NULL');
                if(schema[field].required) definition.push('NOT NULL');
                if(schema[field].default) definition.push(`DEFAULT ${schema[field].default}`);
                fields[field] = definition.join(' ');
            }
           // debug('FIELDS', fields);
            const create = this.createTable( tableName, fields );
           // debug('CREATE', create);

        }

        this.models[Model.name] = Model;
        if(!this.tables[tableName]) this.tables[tableName] = {};
        this.tables[tableName].model = Model;
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
            this.tables[tableName] = {...table};
        }
        this.schema = tables;
       // debug('DB Schema', this.schema);
    }

}

export default SQLiteDatabase;