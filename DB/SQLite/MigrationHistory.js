import Model from "../Model/Model.js";

class MigrationHistory extends Model {
    static tableName = "migration_history";

    static get schema() {
        return {
            id: { type: "integer", primaryKey: true, autoIncrement: true },
            model_name: { type: "text", null: true },
            table_name: { type: "text" },
            field_schema: { type: "json", default: {} },
            hash: { type: "text", null: true },
            version: { type: "integer", default: 0 },
            updated_at: { type: "datetime" }
        };
    }
}

export default MigrationHistory;
