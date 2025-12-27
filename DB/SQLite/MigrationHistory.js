/**
 * Migration history model for tracking database schema changes.
 * Records migration versions and field schemas.
 * @module DB/SQLite/MigrationHistory
 */

import Model from "../Model/Model.js";

/**
 * Model for tracking database migration history.
 * @class MigrationHistory
 * @extends Model
 */
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