/**
 * SQLite storage type constants and type aliases.
 * Defines SQLite data types and their JavaScript equivalents.
 * @module DB/SQLite/Constants
 */

/**
 * SQLite storage type definitions.
 * @type {Array<string>}
 */
export const STORAGE_TYPES = ["INTEGER", "REAL", "TEXT", "NUMERIC", "BLOB", "JSON"];

/**
 * Mapping of SQLite types to JavaScript/SQL type aliases.
 * @type {Object<string, Array<string>>}
 */
export const TYPE_ALIASES = {
    INTEGER: ["int", "bool", "boolean"],
    REAL: ["float", "double", "decimal"],
    TEXT: ["varchar", "string", "set", "text", "string"],
    NUMERIC: ["number", "date", "datetime"],
    BLOB: ["varbinary", "binary"],
    JSON: ["json"]
};