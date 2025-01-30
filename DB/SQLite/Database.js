import BetterSQLite3 from "better-sqlite3";
import { STORAGE_TYPES, TYPE_ALIASES } from "./Constants.mjs";
import Database from "../Database.js";
import { SQL, SQLStatement } from "../SQL.js";
import Migration from "./Migration.mjs";
global.debug = console.log;

class SQLiteDatabase extends Database {
    source = null;

    constructor(databasePath, dbOptions) {
        super(new BetterSQLite3(databasePath, dbOptions));
        this.databasePath = databasePath;
    }

    hasTable(tableName) {
        const query = `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`;
        const result = this.db.prepare(query).get(tableName);
        return result !== undefined;
    }

    createTable(tableName, columnDefinitions) {
        const columns = Object.keys(columnDefinitions)
            .map((column) => `${column} ${columnDefinitions[column]}`)
            .join(", ");
        const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`;
        console.log(query);
        return this.db.exec(query);
    }

    addColumn(table, column, columnDefinition) {
        const definition = Migration.compileField(column, columnDefinition);
        const query = `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`;
        return this.db.exec(query);
    }

    insert(tableName, rowData) {
        const command = SQL.insert(tableName, rowData);
        return this.db.prepare(command.statement).run(command.args);
    }

    insertAll(tableName, records) {
        const statement = SQL.insert(tableName, records[0]).statement;
        const insert = this.db.prepare(statement);
        this.db.transaction(() => {
            records.forEach((record) => {
                insert.run(...Object.values(record));
            });
        })();
    }

    first(table, columns, conditions) {
        const { statement, args } = SQL.select(table, columns, conditions);
        const result = this.db.prepare(statement).get(...args);
        return result;
    }

    all(table, columns = [], conditions = {}, order = {}, limit = null, offset = null) {
        const cmd = new SQLStatement()
            .select(table, columns, conditions)
            .order(order)
            .limit(limit)
            .offset(offset)
            .compile();
        console.log(cmd);
        return this.db.prepare(cmd.statement).all(...cmd.args) || [];
    }

    update(table, data, conditions) {
        const { statement, args } = SQL.update(table, data, conditions);
        return this.db.prepare(statement).run(...args);
    }

    updateAll(table, data, conditions) {
        const cmd = new SQLStatement().update(table, data, conditions).compile();
        return this.db.prepare(cmd.statement).run(...cmd.args);
    }

    delete(table, conditions) {
        const deleteCommand = SQL.delete(table, conditions);
        return this.db.prepare(deleteCommand.statement).run(deleteCommand.args);
    }

    count(table, conditions) {
        const query = SQL.count(table, conditions);
        return this.db.prepare(query.statement).get(...query.args).COUNT;
    }

    async max(table, column, conditions) {
        const { statement, args } = SQL.max(table, column, conditions);
        const result = this.db.prepare(statement).get(...args);
        return result ? result.MAX : null;
    }

    async sum(table, column, conditions) {
        const { statement, args } = SQL.sum(table, column, conditions);
        const result = this.db.prepare(statement).get(...args);
        return result ? result.SUM : null;
    }

    addModel(Model) {
        if (!Model) return;

        Model.db = this;
        const tableName = Model.tableName;
        const tableSchema = this.schema[tableName];
        const fields = Migration.compileFields(Model.schema, Model);
        const useMigration = Model.name !== "Migration";

        if (!tableSchema) {
            this.createTable(tableName, fields);
        } else if (useMigration) {
            const migration = Migration.fromModel(Model);
            const diff = migration.diff(fields);
            if (diff) {
                migration.update(diff, Model.schema);
            }
        }

        this.models[Model.name] = Model;
        this.tables[tableName] = { model: Model };
    }

    registerFunction(name, func, options) {
        return this.db.function(name, options, func);
    }

    registerAggregate(name, { start, step, finalize }) {
        return this.db.aggregate(name, { start, step, finalize });
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
        const internalTables = ["sqlite_sequence", "sqlite_schema", "sqlite_temp_schema"];
        const tables = this.db.pragma("table_list").filter((table) => !internalTables.includes(table.name));
        const tableList = {};
        for (const table of tables) {
            tableList[table.name] = table;
        }
        return tableList;
    }

    backup(destination) {
        if (!destination) {
            const date = new Date();
            destination = `backup-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.db`;
        }
        return this.db.backup(destination);
    }

    initialize() {
        const hasBootTable = this.hasTable("boot");
        if (!hasBootTable) {
            this.createTable("boot", Migration.compileFields(Migration.schema, Migration));
        }

        const tables = this.getTables();
        for (const tableName of Object.keys(tables)) {
            const table = tables[tableName];
            const columns = {};
            for (const column of this.tableInfo(tableName)) {
                columns[column.name] = column;
            }
            table.columns = columns;
            this.tables[tableName] = { ...table };
        }
        this.schema = tables;
        this.addModel(Migration);
    }
}

export default SQLiteDatabase;
