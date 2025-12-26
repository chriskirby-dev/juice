import BetterSQLite3 from "better-sqlite3";
import { STORAGE_TYPES, TYPE_ALIASES } from "./Constants.mjs";
import Database from "../Database.js";
import { SQL, SQLStatement } from "../SQL.js";
import Migration from "./Migration.mjs";
import SQLiteWorker from "./WorkerClient.js";
import SQLBuilder from "../SQLBuilder.js";

global.debug = console.log;

class SQLiteDatabase extends Database {
    source = null;
    useWorker = false;
    worker = null;
    _prepared = {};
    queueCommands = false;

    constructor(databasePath, dbOptions) {
        super(new BetterSQLite3(databasePath, dbOptions));
        this.databasePath = databasePath;
        this.queued = new Map();
        this.queueId = 0;
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

    build(table) {
        return new SQLBuilder(table);
    }

    insert(table, data, queue = false) {
        const { statement, args } = new SQLBuilder(table).insert(data).build();
        return this.run(statement, args);
    }

    insertAll(tableName, records) {
        const { statement } = new SQLBuilder(tableName).insert(records[0]).build();
        const prepared = this.db.prepare(statement);
        const insertAll = this.db.transaction((records) => {
            for (const record of records) prepared.run(...Object.values(record));
        });

        insertAll(records);
    }

    select(table, columns, conditions) {
        const { statement, args } = new SQLBuilder(table).select(columns).where(conditions).build();
        return this.get(statement, args);
    }

    first(table, columns, conditions) {
        const { statement, args } = new SQLBuilder(table).select(columns).where(conditions).limit(1).build();
        return this.get(statement, args);
    }

    many(table, columns, conditions, queue = false) {
        const { statement, args } = new SQLBuilder(table).select(columns).where(conditions).build();
        return this.all(statement, args);
    }

    update(table, data, conditions) {
        const { statement, args } = new SQLBuilder(table).update(data).where(conditions).build();
        return this.run(statement, args);
    }

    updateAll(table, records, conditions, queue = false) {
        const { statement } = new SQLBuilder(table).update(data).where(conditions).build();
        const prepared = this.db.prepare(statement);
        const updateAll = this.db.transaction((records) => {
            for (const record of records) prepared.run(...Object.values(record));
        });

        updateAll(records);
    }

    delete(table, conditions, queue) {
        const { statement, args } = new SQLBuilder(table).delete().where(conditions).build();
        return this.run(statement, args);
    }

    exists(table, conditions, queue = false) {
        const { statement, args } = new SQLBuilder(table).select(["1"]).where(conditions).limit(1).build();
        return this.get(statement, args);
    }

    all(statement, args = []) {
        return this.db.prepare(statement).all(...args) || [];
    }

    run(statement, args = []) {
        // if (this.worker) return this.worker.send({ sql: statement, parameters: args });
        return this.db.prepare(statement).run(...args);
    }

    exec(statement, args = []) {
        // if (this.worker) return this.worker.send({ sql: statement, parameters: args });
        return this.db.exec(statement, ...args);
    }

    get(statement, args = []) {
        //console.log(statement, args);
        // if (this.worker) return this.worker.send({ sql: statement, parameters: args });
        return this.db.prepare(statement).get(...args);
    }

    get worker() {
        if (!this._worker) {
            this._worker = new SQLiteWorker(this.databasePath, {
                timeout: 5000
            });
        }

        return this._worker;
    }

    queue({ action, statement, args }) {
        switch (action) {
            case "insert":
            case "update":
            case "delete":
                action = "run";
                break;
            case "first":
                action = "first";
                break;
            case "select":
                action = "all";
                break;
        }
        const id = this.queueId++;
        this.queued.set(id, { action, statement, args });
    }

    initializeFns() {
        this.registerAggregate("addAll", { start: () => 0, step: (acc, val) => acc + val, finalize: (acc) => acc });
        this.registerAggregate("avg", {
            start: () => 0,
            step: (array, nextValue) => {
                array.push(nextValue);
            },
            result: (array) => array.reduce(sum) / array.length
        });
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

    savePrepared(modelName, name, statement) {
        if (!this._prepared[modelName]) this._prepared[modelName] = {};
        this._prepared[modelName][name] = this.db.prepare(statement);
    }

    getPrepared(modelName, name) {
        return this._prepared[modelName]?.[name];
    }

    hasPrepared(modelName, name) {
        return this._prepared[modelName]?.[name] ? true : false;
    }

    getModel(modelName) {
        return this.models[modelName];
    }

    /**
     * Adds a model to the database.
     * This method is responsible for setting up the database structure for
     * the given model. If the model does not exist in the database, it will
     * be created. If the model exists, it will be checked for changes and
     * updated if needed.
     * @param {Model} Model - The Model to add to the database.
     */
    addModel(Model) {
        // If the model is null, do nothing.
        if (!Model) return;

        console.log("Add Model", Model.name, Model);

        // Set the model's database property to the current database.
        Model.db = this;

        // Get the table name for the model.
        const tableName = Model.tableName;

        // Get the current schema for the table.
        const dbTableSchemaExists = this.schema[tableName] ? true : false;
        console.log("dbTableSchemaExists", dbTableSchemaExists);
        // Get the compiled fields for the model.
        const modelfields = Migration.compileFields(Model.schema, Model);
        console.log("fields", modelfields);
        // Set a flag to indicate whether migrations should be used to update
        // the table structure.
        const useMigration = Model.name !== "Migration";

        // If the table does not exist, create it.
        if (!dbTableSchemaExists) {
            // Create the table.
            this.createTable(tableName, modelfields);

            // If the model has an onCreate method, call it.
            if (Model.onCreate) Model.onCreate();
        }
        // If the table exists and migrations are enabled...
        else if (useMigration) {
            // Get the migration object for the model.
            const migration = Migration.fromModel(Model);
        }

        // Add the model to the database's models object.
        this.models[Model.name] = Model;

        if (Model.added) Model.added();

        // Add the model to the database's tables object.
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

    /**
     * Executes a prepared statement.
     * If the statement starts with "$", the prepared statement
     * is looked up in the `prepared` dictionary.
     * Otherwise, a new prepared statement is created.
     * The result of the execution is returned.
     * @param {string} statement
     * @param {...*} args
     * @returns {object}
     
    run(statement, ...args) {
        //Execute Prepared
        const stmt = statement.charAt(0) == "$" ? this.prepared[statement.substring(1)] : this.db.prepare(statement);
        const info = stmt.run(...args);
        return info;
    }
*/
    /**
     * Executes a SQL statement and returns the first row.
     * If the statement starts with "$", the prepared statement
     * is looked up in the `prepared` dictionary.
     * Otherwise, a new prepared statement is created.
     * The result of the execution is returned.
     * @param {string} statement
     * @param {...*} args
     * @returns {object}
    
    get(statement, ...args) {
        const stmt = statement.charAt(0) == "$" ? this.prepared[statement.substring(1)] : this.db.prepare(statement);
        const resp = stmt.get(...args);
        return resp;
    }
*/

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

    prepare(statement) {
        console.log(statement);
        return this.db.prepare(statement);
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

        this.transaction = this.db.transaction.bind(this.db);

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