import BetterSQLite3 from "better-sqlite3";
import { STORAGE_TYPES, TYPE_ALIASES } from "./Constants.mjs";
import Database from "../Database.js";
import { SQL, SQLStatement } from "../SQL.js";
import Migration from "./Migration.mjs";
global.debug = console.log;

class SQLiteDatabase extends Database {
    source = null;

    constructor(path, options) {
        super(new BetterSQLite3(path, options));
    }

    hasTable(table) {
        const exists = this.db.run(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`, [table]);
        return exists.run();
    }

    createTable(table, fields) {
        return this.db.exec(
            `CREATE TABLE IF NOT EXISTS ${table} ( ${Object.keys(fields).map((f) => `${f} ${fields[f]}`)} )`
        );
    }

    addColumnToTable(table, column, schema) {
        const definition = Migration.compileField(column, schema);
        return this.db.exec(`ALTER TABLE ${table} ADD ${column} ${definition}`);
    }

    insert(table, data) {
        const cmd = SQL.insert(table, data);
        return this.db.prepare(cmd.statement).run(cmd.args);
    }

    insertAll(table, list) {
        const cmd = SQL.insert(table, list[0]);
        newRecord = this.db.prepare(cmd.statement);
        this.db.transaction((item) => {
            newRecord(Object.values(item));
        })(list);
    }

    first(table, columns, conditions) {
        const cmd = SQL.select(table, columns, conditions);
        //debug(cmd);
        return this.db.prepare(cmd.statement).get(...cmd.args);
    }

    all(table, columns, conditions, order, limit, offset) {
        // debug(table, columns, conditions, order, limit, offset );
        const cmd = new SQLStatement().select(table, columns, conditions).order(order).limit(limit).compile();
        // debug(cmd);
        return this.db.prepare(cmd.statement).all(...cmd.args) || [];
    }

    update(table, data, conditions) {
        const cmd = SQL.update(table, data, conditions);
        console.log(cmd);
        return this.db.prepare(cmd.statement).run(...cmd.args);
    }

    updateAll() {
        const cmd = new SQLStatement().update(table, columns, conditions).order(order).limit(limit);
        return this.db.prepare(cmd.statement).run(...cmd.args);
    }

    delete(table, conditions) {
        const cmd = SQL.delete(table, conditions);
        return this.db.prepare(cmd.statement).run(cmd.args);
    }

    count(table, conditions) {
        const cmd = SQL.count(table, conditions);
        // console.log(cmd);
        return this.db.prepare(cmd.statement).get(...cmd.args).COUNT;
    }

    max(table, column, conditions) {
        const cmd = SQL.max(table, column, conditions);
        return this.db.prepare(cmd.statement).get(...cmd.args).MAX;
    }

    sum(table, column, conditions) {
        const cmd = SQL.sum(table, column, conditions);
        return this.db.prepare(cmd.statement).get(...cmd.args).SUM;
    }

    addModel(Model) {
        if (!Model) return;
        Model.db = this;
        const tableName = Model.tableName;
        const schema = Model.schema;
        const tableSchema = this.schema[tableName];

        let useMigration = Model.name !== "Migration" ? true : false;
        const fields = Migration.compileFields(Model.schema, Model);

        if (!tableSchema) {
            // debug('FIELDS', fields);
            const create = this.createTable(tableName, fields);
            // debug('CREATE', create);
        } else {
            let migration = Migration.fromModel(Model);
            const diff = migration.diff(fields);
            if (diff) {
                //has updates
                migration.update(diff, schema);
            }
        }

        this.models[Model.name] = Model;
        if (!this.tables[tableName]) this.tables[tableName] = {};
        this.tables[tableName].model = Model;
    }

    registerFunction(name, fn, options) {
        return this.db.function(name, options, fn);
    }

    registerAggregate(name, options) {
        /*options:
            start, step, result
        */
        return this.db.aggregate(name, options);
    }

    exec(sql) {
        return this.db.exec(sql);
    }

    prepare(id, sql) {
        this.prepared[id] = this.db.prepare(sql);
    }

    run(statement, ...args) {
        //Execute Prepared
        const stmt = statement.charAt(0) == "$" ? this.prepared[statement.substring(1)] : this.db.prepare(statement);
        const info = stmt.run(...args);
        return info;
    }

    get(statement, ...args) {
        const stmt = statement.charAt(0) == "$" ? this.prepared[statement.substring(1)] : this.db.prepare(statement);
        const resp = stmt.get(...args);
        return resp;
    }

    transaction(statement) {}

    remoteRequest(options) {
        let resp;
        switch (options.command) {
            case "insert":
                resp = this.insert(options.table, options.data);
                break;
            case "update":
                resp = this.update(options.table, options.data, options.conditions);
                break;
            case "delete":
                resp = this.delete(options.table, options.conditions);
                break;
            case "first":
                resp = this.first(options.table, options.columns, options.conditions, options.order);
                break;
            case "all":
                resp = this.all(options.table, options.columns, options.conditions, options.order, options.limit);
            default:
                resp = this[options.command](...(options.args ? options.args : []));
        }

        return { index: options.index, response: resp };
    }

    compileFields(fields) {
        return Migration.compileFields(fields);
    }

    backup(destination) {
        return this.db.backup(destination);
    }

    tableInfo(tableName) {
        return this.db.pragma(`table_info(${tableName})`);
    }

    getTables() {
        const internal = ["sqlite_sequence", "sqlite_schema", "sqlite_temp_schema"];
        const tbl_list = this.db.pragma(`table_list`);
        const tables = tbl_list.filter((tbl) => !internal.includes(tbl.name));
        const resp = {};
        for (let i = 0; i < tables.length; i++) {
            resp[tables[i].name] = tables[i];
        }
        return resp;
    }

    initialize() {
        const tables = this.getTables();
        for (let tableName in tables) {
            const table = tables[tableName];
            const tbl = this.tableInfo(table.name);
            const columns = {};
            for (let column of tbl) {
                columns[column.name] = column;
            }
            table.columns = columns;
            this.tables[tableName] = { ...table };
        }
        this.schema = tables;
        this.addModel(Migration);
        // debug('DB Schema', this.schema);
    }
}

export default SQLiteDatabase;
