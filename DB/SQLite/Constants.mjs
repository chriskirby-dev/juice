export const STORAGE_TYPES = ["INTEGER", "REAL", "TEXT", "NUMERIC", "BLOB", "JSON"];

export const TYPE_ALIASES = {
    INTEGER: ["int", "bool", "boolean"],
    REAL: ["float", "double", "decimal"],
    TEXT: ["varchar", "string", "set", "text", "string"],
    NUMERIC: ["number", "date", "datetime"],
    BLOB: ["varbinary", "binary"],
    JSON: ["json"]
};