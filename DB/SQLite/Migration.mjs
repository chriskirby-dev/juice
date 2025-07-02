import Model from "../Model/Model.js";
import { STORAGE_TYPES, TYPE_ALIASES } from "./Constants.mjs";
import * as Condition from "../../Util/Condition.mjs";
import MigrationHistory from "./MigrationHistory.js";
class Migration extends Model {
    static tableName = "migrations";

    static fromModel(Model) {
        const migration = Migration.where({ model_name: Model.name }).first();
        console.log("migration", migration);
        if (migration.exists) {
            console.log("migration for model", Model.name, "exists");
            migration.Model = Model;

            const modelfields = Migration.compileFields(Model.schema, Model);
            console.log("modelfields", modelfields);

            // Get the diff between the current table structure and the
            // desired table structure.
            const diff = migration.diff(modelfields);

            // Log the diff.
            console.log("Migration Diff", diff);

            // If there are any changes to apply...
            if (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0) {
                // Apply the changes using the migration object.
                migration.updateSchema(diff, Model.schema);
            }

            return migration;
        } else {
            console.log("Creating migration for model", Model.name);

            const migration = new Migration();
            migration.Model = Model;
            migration.model_name = Model.name;
            migration.table_name = Model.tableName;
            migration.version = 0;
            migration.field_schema = Migration.compileFields(Model.schema, Model);
            migration.save();

            return migration;
        }
    }

    static saveHistory(migration) {
        const history = new MigrationHistory();
        history.model_name = migration.model_name;
        history.table_name = migration.table_name;
        history.field_schema = migration.field_schema;
        history.version = migration.version;
        history.updated_at = new Date();
        history.save();
    }

    static added() {
        this.db.addModel(MigrationHistory);
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
            created_at: { type: "datetime" }
        };
    }

    static diffTable(current, compare) {
        current.table_name = compare.table_name;
    }

    static diffFields(current, compare) {
        console.log(current, compare);
        const currentKeys = Object.keys(current || {});
        const compareKeys = Object.keys(compare || {});
        const added = compareKeys.filter((k) => !currentKeys.includes(k));
        const removed = currentKeys.filter((k) => !compareKeys.includes(k));
        const changed = currentKeys.filter((k) => compareKeys.includes(k) && !Condition.equal(current[k], compare[k]));
        return {
            added,
            removed,
            changed: changed.map((column) => ({
                column,
                current: JSON.stringify(current[column]),
                compare: JSON.stringify(compare[column])
            }))
        };
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
        if (typeof schema === "string") {
            const raw = schema.trim().toUpperCase();
            schema = { type: "TEXT" };

            for (const type of STORAGE_TYPES) {
                if (raw.includes(type) || TYPE_ALIASES[type].some((alias) => raw.includes(alias.toUpperCase()))) {
                    schema.type = type;
                    break;
                }
            }

            const properties = ["PRIMARY KEY", "AUTOINCREMENT", "UNIQUE", "NULL", "NOT NULL", "DEFAULT"];
            properties.forEach((prop) => {
                if (raw.includes(prop)) {
                    const key = prop.replace(" ", "").toLowerCase();
                    schema[key] = prop === "DEFAULT" ? raw.split("DEFAULT")[1].trim() : true;
                }
            });
        }

        const definedType = STORAGE_TYPES.includes(schema.type.toUpperCase())
            ? schema.type
            : STORAGE_TYPES.find((type) => TYPE_ALIASES[type].includes(schema.type.toLowerCase())) || "TEXT";
        const definition = [definedType.toUpperCase()];

        if (schema.maxLength) definition[0] += `(${schema.maxLength})`;
        if (schema.primaryKey) definition.push("PRIMARY KEY");
        ["autoIncrement", "unique", "null", "required"].forEach((key) => {
            if (schema[key]) definition.push(key.replace(/[a-z]/g, (char) => char.toUpperCase()));
        });
        if (schema.default !== undefined)
            definition.push(
                `DEFAULT ${
                    definedType === "TEXT"
                        ? `'${schema.default}'`
                        : definedType === "JSON"
                        ? `${JSON.stringify(schema.default)}`
                        : schema.default
                } `
            );

        return definition.join(" ");
    }

    diff(fields) {
        console.log("diff", this.field_schema, fields);
        return Migration.diffFields(this.field_schema, fields);
    }

    get fields() {
        return Migration.compileFields(this.Model.schema, this.Model);
    }

    create() {
        const create = this.createTable(this.Model.tableName, this.fields);
    }

    updateSchema(diff, schema) {
        const tableName = this.Model.tableName;
        const tmpTable = `${tableName}_tmp`;

        //Create TMP Table
        this.dropTable(tmpTable);
        this.createTable(tmpTable, this.fields);

        const copyKeys = Object.keys(schema).filter((k) => !diff.removed.includes(k) && !diff.added.includes(k));

        //Copy Records
        this.Model.db.exec(`
            INSERT INTO ${tmpTable} (${copyKeys.join(",")})
            SELECT ${copyKeys.join(",")}
            FROM ${tableName}
        `);

        //Drop Old Table
        this.dropTable(tableName);

        //Rename TMP Table
        this.changeTableName(tmpTable, tableName);

        Migration.saveHistory(this);

        this.field_schema = this.fields;
        this.version += 1;
        this.save();
    }

    createTable(table, fields) {
        // console.log(`CREATE TABLE IF NOT EXISTS ${table} ( ${Object.keys(fields).map((f) => ` ${f} ${fields[f]}`)} )`);
        return this.db.exec(
            `CREATE TABLE IF NOT EXISTS ${table} ( ${Object.keys(fields).map((f) => ` ${f} ${fields[f]}`)} )`
        );
    }

    dropTable(tableName) {
        return this.db.exec(`DROP TABLE IF EXISTS ${tableName}`);
    }

    changeTableName(oldName, newName) {
        return this.db.exec(`ALTER TABLE ${oldName} RENAME TO ${newName}`);
    }

    schemaEqual(_schema) {
        for (const key in schema) {
            if (!_schema[key]) return false;
            for (const k in schema[key]) {
                if (schema[key][k] !== _schema[key][k]) return false;
            }
        }
    }
}

export default Migration;
