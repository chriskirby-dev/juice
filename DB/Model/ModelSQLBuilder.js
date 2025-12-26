import SQLBuilder from "../SQLBuilder.js";

class ModelSQLBuilder extends SQLBuilder {
    constructor(Model) {
        super(Model.tableName);
        this.Model = Model;
    }

    getPrepared(type) {
        const schema = this.Model.schema;

        switch (type) {
            case "insert":
                if (this.Model.prepared[type]) {
                    return this.Model.prepared[type];
                }

                return this.Model.db.getPrepared(this.Model.name, "insert");
                break;
        }
    }

    first() {
        this.limit(1);
        const { statement, args } = this.build();
        console.log(statement, args);
        return new this.Model(this.Model.db.get(statement, args));
    }

    all(asCollection = true) {
        const { statement, args } = this.build();
        return asCollection
            ? this.Model.Collection(this.Model.db.all(statement, args))
            : this.Model.db.all(statement, args);
    }

    queue(action) {
        const { statement, args } = this.build();
        this.Model.db.queue({ action, statement, args });
    }

    save() {
        const { statement, args } = this.build();
        return this.Model.db.run(statement, args);
    }

    exists() {
        const query = this.select("1");
        const { statement, args } = this.build();
        return this.Model.db.get(statement, args)?.["1"] !== undefined;
    }

    run(sql, ...params) {
        return this.Model.db.run(sql, ...params);
    }
}

export default ModelSQLBuilder;