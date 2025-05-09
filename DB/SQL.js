import { empty, type } from "../Util/Core.mjs";

export const ColumnDefinations = {
    INTEGER: ["int", "integeer", "boolean"],
    NUMERIC: ["number", "date", "datetime"],
    REAL: ["float"],
    TEXT: ["string", "text"],
    BLOB: [],
};

export class SQLStatement {
    insert(...args) {
        this._main = SQL.insert(...args);
        return this;
    }

    update(...args) {
        this._main = SQL.update(...args);
        return this;
    }

    select(...args) {
        this._main = SQL.select(...args);
        return this;
    }

    sum(...args) {
        this._main = SQL.select(...args);
        return this;
    }

    delete(...args) {
        this._main = SQL.delete(...args);
        return this;
    }

    order(...args) {
        this._order = SQL.order(...args);
        return this;
    }

    limit(...args) {
        this._limit = SQL.limit(...args);
        return this;
    }

    offset(...args) {
        this._offset = SQL.offset(...args);
        return this;
    }

    compile() {
        return SQL.join(this._main, this._order, this._limit, this._offset);
    }
}

export class SQL {
    static getTableInfo(tableName) {
        const stmt = `PRAGMA table_info(${tableName})`;
    }

    static join(...stmts) {
        let stmt = "",
            args = [];
        while (stmts.length) {
            const s = stmts.shift();
            if (empty(s)) continue;
            stmt += " " + s.statement;
            args = args.concat(s.args);
        }
        return { statement: stmt, args: args };
    }

    static conditions(params) {
        let resp = { statement: "", args: [] };
        if (!empty(params)) {
            resp.statement = `WHERE `;
            resp.statement += Object.keys(params)
                .map((prop) => {
                    if (typeof params[prop] == "string" && params[prop].startsWith("LIKE")) {
                        const cmd = `${prop} LIKE '${params[prop].split(" ").pop()}'`;
                        delete params[prop];
                        return cmd;
                    }
                    if (params[prop] == null) {
                        delete params[prop];
                        return prop + " IS NULL";
                    } else {
                        return prop + " = ?";
                    }
                })
                .join(" AND ");
            resp.args = Object.values(params);
        }
        return resp;
    }

    static insert(table, data) {
        const columns = Object.keys(data);
        let stmt = `INSERT INTO ${table} ( ${columns.join(", ")} ) VALUES ( ${columns.map((c) => "?").join(", ")} )`;
        return {
            statement: stmt,
            args: Object.values(data),
        };
    }

    static update(table, data, conditions) {
        let resp = { statement: "", args: [] };
        const columns = Object.keys(data);
        resp.args = Object.values(data);
        resp.statement = `UPDATE ${table} SET ${columns.map((col) => `${col} = ?`).join(", ")}`;
        if (!empty(conditions)) resp = SQL.join(resp, SQL.conditions(conditions));
        return resp;
    }

    static select(table, columns = [], conditions = {}, order, limit) {
        let resp = { statement: "", args: [] };
        if (empty(columns)) columns = ["*"];
        if (type(columns, "string")) columns = [columns];

        resp.statement = `SELECT ${columns.join(", ")} FROM ${table}`;
        if (!empty(conditions)) resp = SQL.join(resp, SQL.conditions(conditions), SQL.order(order), SQL.limit(limit));

        return resp;
    }

    static sum(table, column, conditions) {
        let resp = { statement: `SELECT SUM(${column}) AS SUM FROM ${table}`, args: [] };
        if (!empty(conditions)) resp = SQL.join(resp, SQL.conditions(conditions));
        return resp;
    }

    static max(table, column, conditions) {
        let resp = { statement: `SELECT MAX(${column}) AS MAX FROM ${table}`, args: [] };
        if (!empty(conditions)) resp = SQL.join(resp, SQL.conditions(conditions));
        return resp;
    }

    static count(table, conditions) {
        let resp = { statement: `SELECT COUNT(*) AS COUNT FROM ${table}`, args: [] };
        if (!empty(conditions)) resp = SQL.join(resp, SQL.conditions(conditions));
        return resp;
    }

    static delete(table, conditions) {
        let resp = { statement: `DELETE FROM ${table}`, args: [] };

        if (!empty(conditions)) resp = SQL.join(resp, SQL.conditions(conditions));
        // console.log(resp);
        return resp;
    }

    static createTable(table, fields) {
        let resp = { statement: "", args: [] };
        resp.statement = `CREATE TABLE IF NOT EXISTS ${table} ( ${Object.keys(fields).map(
            (f) => `${f} ${fields[f]}`
        )} )`;
        return resp;
    }

    static alterTable(table, fields) {
        let resp = { statement: "", args: [] };
        resp.statement = `ALTER TABLE ${table}`;
    }

    static order(order) {
        if (empty(order)) return;
        return { statement: `ORDER BY ${type(order, "array") ? order.join(", ") : order}`, args: [] };
    }

    static limit(limit) {
        if (empty(limit)) return;
        return { statement: `LIMIT ?`, args: [limit] };
    }

    static offset(offset) {
        if (empty(offset)) return;
        return { statement: `OFFSET ?`, args: [offset] };
    }
}

export default SQL;
