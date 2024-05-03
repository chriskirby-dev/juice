import SQL from './SQL.mjs';

class SQLite_Table {
    db;
    constructor( db ){
        this.db = db;
    }

}

class SQLite_Migration_Table_Column {

    name;
    type;
    options = {};
    actions = [];
    exists=false;

    constructor( name, type ){
        this.name = name;
        this.type = type;
    }

    unique( is=true ){
        if(!is){
            delete this.options.unique;
        }else{
            this.options.unique = true;
        }
        return this;
    }

    primary( is=true ){
        if(!is){
            delete this.options.primary;
        }else{
            this.options.primary = true;
        }
        return this;
    }

    autoIncrement( is=true ){
        if(!is){
            delete this.options.ai;
        }else{
            this.options.ai = true;
        }
        return this;
    }

    notNull( is=true ){
        if(!is){
            delete this.options.notNull;
        }else{
            this.options.notNull = true;
        }
        return this;
    }

    drop(){
        this.actions.push(['drop']);
    }

    rename( name ){
        this.actions.push([ 'rename', name ]);
    }

    define(){
        let def = [this.type];
        if(this.options.primary){
            def.push('PRIMARY KEY');
        }
        if(this.options.unique){
            def.push('UNIQUE');
        }
        if(this.options.ai){
            def.push('AUTOINCREMENT');
        }
        if(this.options.notNull){
            def.push('NOT NULL');
        }
        return def.join(' ');
    }
}

class SQLite_Migration_Table {

    name;
    columns={};
    exists=false;

    constructor( name ){
        this.name = name;
    }

    column( name ){
        return this.columns[name];
    }

    integer( name ){
        this.columns[name] = new SQLite_Migration_Table_Column( name, 'INTEGER' );
        return this.columns[name];
    }

    float( ...args ){
        return this.real( ...args );
    }

    real( name ){
        this.columns[name] = new SQLite_Migration_Table_Column( name, 'REAL' );
        return this.columns[name];
    }

    text( name, length ){
        this.columns[name] = new SQLite_Migration_Table_Column( name, `TEXT${ length ? '('+length+')' : '' }` );
        return this.columns[name];
    }

    blob( name, ...options ){
        this.columns[name] = new SQLite_Migration_Table_Column( name, 'BLOB' );
        return this.columns[name];
    }

    applied(){

    }

    actions(){
        const actions = [];
        if(!this.exists){
            const create = `CREATE TABLE IF NOT EXISTS ${this.name} (
                ${Object.keys(this.columns).map( f => `${f} ${this.columns[f].define()}` )}
            );`;
            actions.push(create);
        }else{

        }

        return actions;
    }
}

class SQLite_Migrations {

    db;
    migrations;
    tables = {};

    constructor( db, migrations ){
        this.db = db;
        if(migrations) this.load(migrations);
    }

    get current(){
        return this.db.version < this.migrations.length;
    }

    load( migrations ){
        for(let i=0;i<=this.db.version;i++){
            this.ran(migrations[i]);
        }
    }

    ran( migration ){
        for( let tableName in migration ){
            if( !this.tables[tableName] ){
                this.tables[tableName] = new SQLite_Migration_Table(tableName);
            }
            migration[tableName](this.tables[tableName]);
        }

        for( let tableName in this.tables ){
            const actions = this.tables[tableName].actions();
            
        }
    }

    run(){
        if(this.current) return false;
        const schema = this.db.schema;
        const todo = this.migrations.slice( this.db.version+1 );
        console.log('TODO Migrations', todo);
        const actions = {};
        for(let i=0;i<todo.length;i++){
            const migration = todo[i];
            for( let tableName in migration ){
                const tableExists = schema[tableName] ? true : false;
                const table = migration[tableName];
                actions[tableName] = { 
                    action: tableExists ? 'ALTER' : 'CREATE', 
                    table: tableName 
                };
                for(let column in table ){
                    const columnExists = tableExists ? ( schema[tableName][column] ? true : false ) : false;

                }
            }
        }
    }

    alter(){

    }

    create(){

    }

}

class SQLite3_Schema {
    db;
    tree = {};
    constructor( db ){
        this.db = db;
        this.initialize();
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

    tableInfo( tableName ){
        return this.db.pragma(`table_info(${tableName})`);
    }

    hasTable( name ){
        return this.tree[name] ? true : false;
    }

    tableHasColumn( table, name ){
        if( !this.hasTable(table) ) return false;
        return this.tree[table].columns[name] ? true : false;
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
        this.tree = tables;
    }
}


class SQLite3 {

    db;

    #defined = {};

    constructor( sqlite3_instance ){
        this.db = sqlite3_instance;
        this.initialize();
    }

    get version(){
        return this.#defined.version;
    }

    set version(version){
        this.db.pragma(`user_version = ${version};`)
    }


    setMigrations( migrations ){
        this.migration = new SQLite_Migrations( this, migrations );
        console.log( 'Migration Current', this.migration.current );
    }

    migrate( type ){
        if(this.migration.current) return;
        switch(type){
            case '':
            break;
        }
        this.migration.run();
    }

    initialize(){
        this.#defined.version = this.db.pragma(`user_version`)[0].user_version;
        this.schema = new SQLite3_Schema( this.db )
    }
}

export default SQLite3;