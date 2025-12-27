/**
 * Model file generator for creating model classes from templates.
 * CLI utility for scaffolding database models.
 * @module DB/Model/make
 */

import fs, { writeFileSync } from "node:fs";
import path from "path";

/**
 * Converts camelCase string to snake_case plural.
 * @private
 * @param {string} str - String to convert
 * @returns {string} snake_case plural string
 */
function toSnakePlural(str) {
    return (
        str
            // Insert underscore before each capital letter (except the first)
            .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
            // Lowercase everything
            .toLowerCase() +
        // Add "s" for plural (basic pluralization)
        "s"
    );
}

const dir = process.argv[2].includes("/") ? process.argv[2].substring(0, process.argv[2].lastIndexOf("/")) : "";
const modelName = process.argv[2].replace(dir, "");
const tableName = toSnakePlural(modelName);
const modelPath = path.resolve(process.cwd().replace(/\\/g, "/"), dir, `./${modelName}.js`);

const code = `
import Model from "../../../vendor/juice/DB/Model/Model.js";


class ${modelName} extends Model {

    static get tableName() {
        return "${tableName}";
    }

    static get primaryKey() {
        return "id";
    }

    static get schema() {
        return {
            id: { type: "integer", primaryKey: true, autoIncrement: true },
            created_at: { type: "datetime" },
            updated_at: { type: "datetime" }
        };
    }
}

export default ${modelName};
`;

fs.writeFileSync(modelPath, code);