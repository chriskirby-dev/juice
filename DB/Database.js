import EventEmitter from "../Event/Emitter.mjs";
import fs from "node:fs";
import path from "node:path";

class Database extends EventEmitter {
    models = {};
    tables = {};

    static _queue = [];

    static queue(modelName, data) {
        const model = new this.models[modelName](data);
        model.save();
    }

    constructor(db) {
        super();
        this.db = db;
        this.initialize();
    }

    model(name) {
        return this.models[name];
    }

    modelByTable(tableName) {
        return this.tables[tableName].model;
    }

    addModel(Model) {}

    createTable(tableName, fields) {}

    deleted(table, records) {
        const Model = this.modelByTable(table);
        Model.emit("deleted", records);
    }

    created(table, records) {
        const Model = this.modelByTable(table);
        Model.emit("created", records);
    }

    updated(table, records) {
        const Model = this.modelByTable(table);
        Model.emit("updated", records);
    }

    hasTable(table) {}

    createTable(table, fields) {}

    insert() {}

    insertAll() {}

    get() {}

    getAll() {}

    update() {}

    updateAll() {}

    delete() {}

    loadModelDirectory(dir) {
        function loadModel(path) {
            return new Promise((resolve, reject) => {
                import(path).then((model) => {
                    resolve(model.default);
                });
            });
        }

        const isFile = (fileName) => {
            return fs.lstatSync(fileName.toString()).isFile();
        };
        const files = fs
            .readdirSync(dir)
            .map((fileName) => {
                return path.join(dir, fileName);
            })
            .filter(isFile)
            .map(loadModel);

        return Promise.all(files).then((models) => {
            models.forEach((model) => {
                this.addModel(model);
            });
            return true;
        });
    }

    model(name) {
        return this.models[name];
    }
}

export default Database;