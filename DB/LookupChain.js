/**
 * Fluent query builder for database lookups with method chaining.
 * Provides SELECT, WHERE, ORDER BY, LIMIT, and other SQL operations.
 * @module DB/LookupChain
 */

import Collection from "./Model/Collection.mjs";

/**
 * Query builder class using method chaining pattern.
 * @class LookupChain
 * @example
 * const chain = new LookupChain(UserModel);
 * chain.select(['name', 'email']).where({active: 1}).limit(10).get();
 */
class LookupChain {
    chain = {
        columns: ["*"],
    };

    constructor(Model, options = {}) {
        this.options = options;
        this.Model = Model;
        this.tableName = Model.tableName;
    }

    select(columns) {
        this.chain.columns = columns;
        return this;
    }

    sum(column, alias) {
        this.chain.columns = `SUM(${column}) AS ${alias || column + "s"}`;
        return this;
    }

    where(conditions) {
        this.chain.conditions = conditions;
        return this;
    }

    orderBy(order) {
        this.chain.order = order;
        return this;
    }

    limit(limit) {
        this.chain.limit = limit;
        return this;
    }

    offset(offset) {
        this.chain.offset = offset;
        return this;
    }

    first() {
        const { Model } = this;
        const { columns = ["*"], conditions = {} } = this.chain;
        const first = Model.db.first(Model.tableName, columns.join(", "), conditions);
        return new Model(first, this.options);
    }

    all(_limit, _offset) {
        // debug(this.chain);

        if (_limit) this.chain.limit = _limit;
        if (_offset) this.chain.offset = _offset;
        const { Model } = this;
        const { columns = ["*"], conditions = {}, order, limit, offset } = this.chain;
        const all = Model.db.all(Model.tableName, columns.join(", "), conditions, order, limit, offset);
        return Model.Collection(all, this.options);
    }
}

export default LookupChain;