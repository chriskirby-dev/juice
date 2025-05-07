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
        const result = this.db.exec(query);
        if (result.error) {
            console.log(result.error);
            return false;
        }

        return result;
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

    /**
     * Counts the number of records in the given table that match the given conditions.
     *
     * @param {string} table - The name of the table to count records in.
     * @param {Object} [conditions] - The conditions to match records against.
     * @returns {number} - The number of records in the table that match the given conditions.
     */
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

    /**
     * Adds a model to the database.
     * If the model does not exist in the database, it will be created.
     * If the model exists, it will be checked for changes and updated if needed.
     * @param {Model} Model - The Model to add to the database.
     */
    addModel(Model) {
        if (!Model) return;

        Model.db = this;
        const tableName = Model.tableName;
        const tableSchema = this.schema[tableName];
        const fields = Migration.compileFields(Model.schema, Model);
        const useMigration = Model.name !== "Migration";

        if (!tableSchema) {
            this.createTable(tableName, fields);
            if (Model.onCreate) Model.onCreate();
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

    /**
     * Registers a scalar function on the SQLite database.
     * @param {string} name The name of the scalar function.
     * @param {function} func The function to call when the scalar function is
     *   invoked.
     * @param {{varargs: boolean}} [options] Options to pass to BetterSQLite3's
     *   `function` method. If `varargs` is `true`, the function will be called
     *   with a variable number of arguments.
     * @return {void}
     */
    registerFunction(name, func, options) {
        return this.db.function(name, options, func);
    }

    /**
     * Registers an aggregate function on the SQLite database.
     * @param {string} name The name of the aggregate function.
     * @param {{start: function, step: function, finalize: function}} options
     *   The functions to call during the aggregation process.
     *   `start` is called once at the beginning with no arguments.
     *   `step` is called once for each row in the aggregation set with
     *   the current value of the aggregate and the values from the row.
     *   `finalize` is called once at the end with the final value of the
     *   aggregate.
     * @returns {object} The result of registering the aggregate function.
     */
    registerAggregate(name, { start, step, finalize }) {
        return this.db.aggregate(name, { start, step, finalize });
    }

    /**
     * Executes a raw SQL query on the SQLite database.
     * @param {string} sql The SQL query to execute.
     * @returns {object} The result object from the `exec` method of the underlying SQLite database.
     */
    exec(sql) {
        return this.db.exec(sql);
    }

    /**
     * Prepares a statement with the given ID and SQL.
     * @param {string} id
     * @param {string} sql
     */
    prepare(id, sql) {
        this.prepared[id] = this.db.prepare(sql);
    }

    /**
     * Executes a prepared statement.
     * If the statement starts with "$", the prepared statement
     * is looked up in the `prepared` dictionary.
     * Otherwise, a new prepared statement is created.
     * The result of the execution is returned.
     * @param {string} statement
     * @param {...*} args
     * @returns {object}
     */
    run(statement, ...args) {
        //Execute Prepared
        const stmt = statement.charAt(0) == "$" ? this.prepared[statement.substring(1)] : this.db.prepare(statement);
        const info = stmt.run(...args);
        return info;
    }

    /**
     * Executes a SQL statement and returns the first row.
     * If the statement starts with "$", the prepared statement
     * is looked up in the `prepared` dictionary.
     * Otherwise, a new prepared statement is created.
     * The result of the execution is returned.
     * @param {string} statement
     * @param {...*} args
     * @returns {object}
     */
    get(statement, ...args) {
        const stmt = statement.charAt(0) == "$" ? this.prepared[statement.substring(1)] : this.db.prepare(statement);
        const resp = stmt.get(...args);
        return resp;
    }

    transaction(statement) {}

    /**
     * Executes a remote request.
     * @param {Object} options
     * @param {string} options.command
     * @param {string} options.table
     * @param {Object} [options.data]
     * @param {Object} [options.conditions]
     * @param {Array} [options.columns]
     * @param {Object} [options.order]
     * @param {number} [options.limit]
     * @param {number} [options.index]
     * @returns {Object}
     */
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

    /**
     * Compiles the fields into a string that can be used in a create table statement.
     * @param {Object} fields
     * @returns {string}
     */
    compileFields(fields) {
        return Migration.compileFields(fields);
    }

    /**
     * Returns the table info for the specified table.
     * @param {string} tableName
     * @returns {Array} An array of objects, each representing a column in the table.
     * Each object has the following properties:
     * - cid: The column ID.
     * - name: The column name.
     * - type: The column data type.
     * - notnull: Whether the column can be null.
     * - default: The default value for the column.
     * - pk: Whether the column is the primary key.
     */
    tableInfo(tableName) {
        return this.db.pragma(`table_info(${tableName})`);
    }

    /**
     * Returns a list of all tables in the database, excluding the following
     * internal tables:
     *
     * - sqlite_sequence
     * - sqlite_schema
     * - sqlite_temp_schema
     *
     * The returned object has the following structure:
     *
     * {
     *   "table1": {
     *     "name": "table1",
     *     "rootpage": 2
     *   },
     *   "table2": {
     *     "name": "table2",
     *     "rootpage": 3
     *   },
     *   ...
     * }
     *
     * @returns {Object<string, Object>}
     */
    getTables() {
        const internalTables = ["sqlite_sequence", "sqlite_schema", "sqlite_temp_schema"];
        const tables = this.db.pragma("table_list").filter((table) => !internalTables.includes(table.name));
        const tableList = {};
        for (const table of tables) {
            tableList[table.name] = table;
        }
        return tableList;
    }

    /**
     * Creates a backup of the database.
     * If the destination path is not specified, a file with the current date
     * and time is created in the current working directory.
     * @param {string} [destination] The path to the backup file.
     * @returns {Promise<void>}
     */
    backup(destination) {
        if (!destination) {
            const date = new Date();
            destination = `backup-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.db`;
        }
        return this.db.backup(destination);
    }

    /**
     * Initializes the database.
     * If the "boot" table does not exist, it will be created with the current migration schema.
     * Then, it will loop through all the tables in the database and create a column map for each one.
     * Finally, it will add the Migration model to the database.
     * This method is called automatically in the constructor, but you can call it manually if needed.
     */
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
