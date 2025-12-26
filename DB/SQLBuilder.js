import { empty, type } from "../Util/Core.mjs";
/*
This is a JavaScript class definition for a SQL builder, which helps construct SQL queries in a programmatic way. Here's a succinct explanation of what each class method does:

Constructor and Reset

constructor()
: Initializes the SQL builder with default values.
_reset()
: Resets the SQL builder to its initial state, clearing all properties.
CRUD Operations

table(name): Sets the table name for the query.
select(columns = '*')
: Specifies the columns to select (defaults to all columns).
insert(data)
: Inserts data into the table.
replace(data)
: Replaces data in the table (similar to insert, but replaces existing data).
update(data)
: Updates data in the table.
delete()
: Deletes data from the table.
create(definition)
: Creates a new table with the given definition.
drop(): Drops the table.
alter(command)
: Alters the table structure.
truncate(): Truncates the table (not supported by SQLite, emulated using DELETE).
Clauses

where(conditions): Adds conditions to the WHERE clause.
limit(n): Sets the limit for the query.
offset(n): Sets the offset for the query.
orderBy(column, direction = 'ASC'): Specifies the ordering of the results.
groupBy(column): Groups the results by the specified column.
having(condition): Adds a HAVING clause to the query.
join(type, table, onCondition)
: Joins another table to the query.
Final Output

toSQL(): Returns the constructed SQL query as a string, along with an array of parameters.
_buildSQL()
: Builds the SQL query string based on the set properties.

*/
class SQLBuilder {
    /**
     * @param {string} [table] - Set the table name for the query
     */
    constructor(table) {
        this._reset();

        if (table) this.table(table);
    }

    /**
     * Resets the SQL builder to its initial state
     */
    _reset() {
        this._type = null;
        this._table = "";
        this._columns = "*";
        this._values = null;
        this._set = null;
        this._where = [];
        this._limit = "";
        this._offset = "";
        this._orderBy = "";
        this._groupBy = "";
        this._having = "";
        this._joins = [];
        this._createDef = "";
        this._alter = "";
        this._params = [];
        this._whereParams = [];
        this._args = {
            values: [],
            where: [],
            limit: null,
            offset: null
        };
    }

    // --- CRUD operations ---

    /**
     * Sets the table name for the query
     * @param {string} name - The table name
     * @returns {this}
     */
    table(name) {
        this._table = name;
        return this;
    }

    /**
     * Specifies the columns to select (defaults to all columns)
     * @param {string|string[]} columns - The columns to select
     * @returns {this}
     */
    select(columns = "*") {
        this._type = "SELECT";
        this._columns = Array.isArray(columns) ? columns.join(", ") : columns;
        return this;
    }

    count(conditions) {
        this._type = "SELECT";
        this._columns = "COUNT(*) AS count";
        if (conditions) this.where(conditions);
        return this;
    }

    exists(conditions) {
        this._type = "SELECT";
        this._columns = "1";
        if (conditions) this.where(conditions);
        return this;
    }

    /**
     * Inserts data into the table
     * @param {object} data - The data to insert
     * @returns {this}
     */
    insert(data) {
        this._type = "INSERT";
        this._values = data;
        return this;
    }

    /**
     * Replaces data in the table (similar to insert, but replaces existing data)
     * @param {object} data - The data to replace
     * @returns {this}
     */
    replace(data) {
        this._type = "REPLACE";
        this._values = data;
        return this;
    }

    /**
     * Updates data in the table
     * @param {object} data - The data to update
     * @returns {this}
     */
    update(data) {
        this._type = "UPDATE";
        this._set = data;
        return this;
    }

    /**
     * Deletes data from the table
     * @returns {this}
     */
    delete(conditions) {
        if (conditions) this.where(conditions);
        this._type = "DELETE";
        return this;
    }

    /**
     * Creates a new table with the given definition
     * @param {string} definition - The table definition
     * @returns {this}
     */
    create(definition) {
        this._type = "CREATE";
        this._createDef = definition;
        return this;
    }

    /**
     * Drops the table
     * @returns {this}
     */
    drop() {
        this._type = "DROP";
        return this;
    }

    /**
     * Alters the table structure
     * @param {string} command - The alter command
     * @returns {this}
     */
    alter(command) {
        this._type = "ALTER";
        this._alter = command;
        return this;
    }

    /**
     * Truncates the table (not supported by SQLite, emulated using DELETE)
     * @returns {this}
     */
    truncate() {
        this._type = "TRUNCATE";
        return this;
    }

    // --- Clauses ---

    /**
     * Adds conditions to the WHERE clause
     * @param {object} conditions - The conditions to add
     * @returns {this}
     */
    where(conditions) {
        for (const rawKey in conditions) {
            let operator = "=";
            let key = rawKey;

            // Extract operator from key if present
            const match = rawKey.match(/^(.*?)\s*(=|!=|<>|>|<|>=|<=|LIKE|IS|IS NOT|IN|NOT IN)?$/i);
            if (match) {
                key = match[1].trim();
                if (match[2]) operator = match[2].toUpperCase();
            }

            const value = conditions[rawKey];

            if (operator === "IN" || operator === "NOT IN") {
                if (!Array.isArray(value)) throw new Error(`${operator} expects an array`);
                const placeholders = value.map(() => "?").join(", ");
                this._where.push(`${key} ${operator} (${placeholders})`);
                this._args.where.push(...value);
            } else if ((operator === "IS" || operator === "IS NOT") && value === null) {
                this._where.push(`${key} ${operator} NULL`);
            } else {
                this._where.push(`${key} ${operator} ?`);
                this._args.where.push(value);
            }
        }
        return this;
    }

    /**
     * Sets the limit for the query
     * @param {number} n - The limit
     * @returns {this}
     */
    limit(n) {
        if (empty(n)) return this;
        this._limit = `LIMIT ?`;
        this._args.limit = n;
        return this;
    }

    /**
     * Sets the offset for the query
     * @param {number} n - The offset
     * @returns {this}
     */
    offset(n) {
        if (empty(n)) return this;
        this._offset = `OFFSET ?`;
        this._args.offset = n;
        return this;
    }

    /**
     * Specifies the ordering of the results
     * @param {string} column - The column to order by
     * @param {string} [direction] - The direction to order by (defaults to ASC)
     * @returns {this}
     */
    orderBy(column, direction = "ASC") {
        this._orderBy = `ORDER BY ${column} ${direction.toUpperCase()}`;
        return this;
    }

    /**
     * Groups the results by the specified column
     * @param {string} column - The column to group by
     * @returns {this}
     */
    groupBy(column) {
        this._groupBy = `GROUP BY ${column}`;
        return this;
    }

    /**
     * Adds a HAVING clause to the query
     * @param {string} condition - The condition to add
     * @returns {this}
     */
    having(condition) {
        this._having = `HAVING ${condition}`;
        return this;
    }

    /**
     * Joins another table to the query
     * @param {string} type - The type of join (INNER, LEFT, RIGHT, FULL)
     * @param {string} table - The table to join
     * @param {string} onCondition - The condition to join on
     * @returns {this}
     */
    join(type, table, onCondition) {
        this._joins.push(`${type.toUpperCase()} JOIN ${table} ON ${onCondition}`);
    }

    /**
     * Builds the SQL query string based on the set properties.
     * @returns {{sql: string, params: any[]}} An object with the constructed SQL query string and an array of parameters.
     */

    build() {
        const statement = this._buildSQL() + ";";
        const args = [...this._params];
        this._reset();
        return { statement, args };
    }

    _buildSQL() {
        let sql = "";

        switch (this._type) {
            case "SELECT":
                sql = `SELECT ${this._columns} FROM ${this._table}`;
                break;

            case "INSERT": {
                const keys = Object.keys(this._values);
                const placeholders = keys.map(() => "?");
                sql = `INSERT INTO ${this._table} (${keys.join(", ")}) VALUES (${placeholders.join(", ")})`;
                this._args.values = Object.values(this._values);
                break;
            }

            case "REPLACE": {
                const keys = Object.keys(this._values);
                const placeholders = keys.map(() => "?");
                sql = `REPLACE INTO ${this._table} (${keys.join(", ")}) VALUES (${placeholders.join(", ")})`;
                this._args.values = Object.values(this._values);
                break;
            }

            case "UPDATE": {
                console.log(this._params);
                console.log("UPDATE", this._set);
                const sets = Object.entries(this._set).map(([key, val]) => {
                    console.log(key, val);
                    return `${key} = ?`;
                });
                this._args.values = Object.values(this._set);
                console.log(this._params);
                sql = `UPDATE ${this._table} SET ${sets.join(", ")}`;
                break;
            }

            case "DELETE":
                sql = `DELETE FROM ${this._table}`;
                break;

            case "CREATE":
                sql = `CREATE TABLE IF NOT EXISTS ${this._table} (${this._createDef})`;
                break;

            case "DROP":
                sql = `DROP TABLE IF EXISTS ${this._table}`;
                break;

            case "ALTER":
                sql = `ALTER TABLE ${this._table} ${this._alter}`;
                break;

            case "TRUNCATE":
                // Not actually supported by SQLite — emulate
                sql = `DELETE FROM ${this._table}; DELETE FROM sqlite_sequence WHERE name = ?`;
                this._params.push(this._table);
                return sql; // Return early — no clause chaining
        }

        this._params.unshift(...this._args.values);

        if (this._joins.length) sql += " " + this._joins.join(" ");
        if (this._where.length) {
            sql += " WHERE " + this._where.join(" AND ");
            if (this._args.where.length) this._params.push(...this._args.where);
        }
        if (this._groupBy) sql += " " + this._groupBy;
        if (this._having) sql += " " + this._having;
        if (this._orderBy) sql += " " + this._orderBy;
        if (this._limit) sql += " " + this._limit;
        if (this._args.limit) this._params.push(this._args.limit);
        if (this._offset) sql += " " + this._offset;
        if (this._args.offset) this._params.push(this._args.offset);

        return sql;
    }
}

export default SQLBuilder;