/**
 * SQL condition builder for constructing WHERE clauses and query conditions.
 * Provides fluent interface for building complex SQL conditions with operators like LIKE, comparison, etc.
 * @module DB/Conditions
 */

/**
 * Builder class for SQL query conditions.
 * Provides methods to construct WHERE clause conditions from objects and key-value pairs.
 * @class Conditions
 */
class Conditions {
    commands = [];
    from(object) {
        for (let key in object) {
            if (object[key].startsWith("LIKE")) {
                this.commands.push(
                    `${this[key]} LIKE ${typeof object[key] == "string" ? `'${object[key]}'` : object[key]}`
                );
            }
            this.commands.push(`${this[key]} = ${typeof object[key] == "string" ? `'${object[key]}'` : object[key]}`);
        }
    }
}

export default Conditions;