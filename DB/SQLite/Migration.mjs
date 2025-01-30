import Model from "../Model/Model.js";
import { STORAGE_TYPES, TYPE_ALIASES } from "./Constants.mjs";
import * as Condition from "../../Util/Condition.mjs";

class Migration extends Model {
    static tableName = "migrations";

    static fromModel(Model) {
        const migration = Migration.where({ model_name: Model.name }).first();
        if (migration.exists) {
            console.log("migration for model", Model.name, "exists");
            migration.Model = Model;
            return migration;
        } else {
            console.log("Creating migration for model", Model.name);

            const migration = new Migration();
            migration.Model = Model;
            migration.model_name = Model.name;
            migration.table_name = Model.tableName;
            migration.field_schema = Migration.compileFields(Model.schema, Model);
            migration.save();
            return migration;
        }
    }

    static get schema() {
        return {
            id: { type: "integer", primaryKey: true, autoIncrement: true },
            model_name: { type: "text", null: true },
            table_name: { type: "text" },
            field_schema: { type: "json", default: {} },
            hash: { type: "text", null: true },
            version: { type: "integer", default: 0 },
            updated_at: { type: "datetime" },
            created_at: { type: "datetime" },
        };
    }

    static diffFields(current, compare) {
        const diff = { added: [], removed: [], changed: [] };
        const currentKeys = Object.keys(current || {});
        const compareKeys = Object.keys(compare || {});
        diff.added = compareKeys.filter((k) => !currentKeys.includes(k));
        diff.removed = currentKeys.filter((k) => !compareKeys.includes(k));
        const columnsInBoth = compareKeys.filter((k) => currentKeys.includes(k));
        for (const column of columnsInBoth) {
            if (!Condition.equal(current[column], compare[column])) {
                diff.changed.push({
                    column: column,
                    current: JSON.stringify(current[column]),
                    compare: JSON.stringify(compare[column]),
                });
                continue;
            }
        }
        if (!diff.added.length) delete diff.added;
        if (!diff.removed.length) delete diff.removed;
        if (!diff.changed.length) delete diff.changed;
        return Object.keys(diff).length ? diff : null;
    }

    static compileFields(schema, Model) {
        const fields = {};

        if (Model.timestamps) {
            schema.updated_at = { type: "datetime", value: "CURRENT_TIMESTAMP" };
            schema.created_at = { type: "datetime", default: "CURRENT_TIMESTAMP" };
            schema.deleted_at = { type: "datetime", null: true };
        }

        for (const field in schema) {
            fields[field] = this.compileField(field, schema[field]);
        }
        return fields;
    }

    static compileField(field, schema) {
        let type = schema.type.toUpperCase();
        if (type == "SET") type = "TEXT";
        if (STORAGE_TYPES.includes(type)) {
        }
        const definition = [type];
        if (schema.maxLength) definition[0] += `(${schema.maxLength})`;
        if (schema.primaryKey) definition.push("PRIMARY KEY");
        if (schema.autoIncrement) definition.push("AUTOINCREMENT");
        if (schema.unique) definition.push("UNIQUE");
        if (schema.null) definition.push("NULL");
        if (schema.required) definition.push("NOT NULL");
        if (schema.default) definition.push(`DEFAULT ${schema.default}`);
        return definition.join(" ");
    }

    diff(fields) {
        return Migration.diffFields(this.field_schema, fields);
    }

    get fields() {
        return Migration.compileFields(this.Model.schema, this.Model);
    }

    create() {
        const create = this.createTable(this.Model.tableName, this.fields);
    }

    update(diff, schema) {
        const tableName = this.Model.tableName;
        const tmpTable = `${tableName}_tmp`;

        //Create TMP Table
        const create = this.createTable(this.table_name + "_tmp", this.fields);
        const records = this.Model.all();

        this.Model.tableName = tmpTable;
        for (let i = 0; i < records.length; i++) {
            const copy = new this.Model(records[i].toJson(), { with: [] });
            this.Model.db.insert(tmpTable, copy.toJson());
        }

        this.dropTable(tableName);
        this.changeTableName(tmpTable, tableName);

        this.Model.tableName = tableName;

        this.field_schema = this.fields;
        this.save();
    }

    createTable(table, fields) {
        return this.db.exec(
            `CREATE TABLE IF NOT EXISTS ${table} ( ${Object.keys(fields).map((f) => `${f} ${fields[f]}`)} )`
        );
    }

    dropTable(tableName) {
        return this.db.exec(`DROP TABLE IF EXISTS ${tableName}`);
    }

    changeTableName(oldName, newName) {
        return this.db.exec(`ALTER TABLE ${oldName} RENAME TO ${newName}`);
    }

    schemaEqual(_schema) {
        const schema = this.schema;
        for (const key in schema) {
            if (!_schema[key]) return false;
            for (const k in schema[key]) {
                if (schema[key][k] !== _schema[key][k]) return false;
            }
        }
    }
}

export default Migration;
