import EventEmitter from "../../Event/Emitter.mjs";
import Collection from "./Collection.mjs";
import DistinctArray from "../../DataTypes/DistinctArray.mjs";
import { type, empty, equals, exists } from "../../Util/Core.mjs";
import { normalCase, studly, unStudly, pascalCase, dashed } from "../../Util/String.mjs";
import { setEnumerability } from "../../Util/Object.mjs";
import Watch from "../../Proxy/Watch.mjs";
import ModelSQLBuilder from "./ModelSQLBuilder.js";
import FormBuilder from "../../Form/Builder.mjs";

class Model extends EventEmitter {
    static key = null;
    static tableName = "";
    static primaryKey = "id";
    static primaryLabel;
    static foreignKey;
    static localKey;
    static debug = false;
    static index = 0;
    static async = false;

    static db;

    #data = {};
    #changed = [];
    #required = [];
    #valid = [];
    #queued = [];
    #args = [];
    #private = {};
    #protected = {};
    relationships = {};
    static _prepared = {};

    static component = { tagName: "", attributes: {}, instance: null };

    get static() {
        return this.constructor;
    }

    static queryBuilder() {
        return new ModelSQLBuilder(this);
    }

    static getPrepared(name) {
        return this.db.getPrepared(this.name, name);
    }

    static hasPrepared(name) {
        return this.db.hasPrepared(this.name, name);
    }

    static savePrepared(name, statement) {
        return this.db.savePrepared(this.name, name, statement);
    }

    /**
     * Creates a new Collection instance from the given data. If no data is
     * provided, an empty array is used. If data is not an array, an error is
     * thrown.
     *
     * @param {Array} [data] - Data to be inserted into collection
     * @returns {Proxy} - A proxy object for the collection
     * @throws {Error} - If data is not an array
     */
    static Collection(data) {
        console.log(!type(data, "object"));
        if (data && !type(data, "array") && !type(data, "object")) {
            if (Model.debug) console.log(data);
            throw new Error(
                `Collection ${this.name} must supply array or null ${typeof data} provided: ` + JSON.stringify(data)
            );
        } else if (empty(data)) {
            data = [];
        }
        return new Collection(data, this);
    }

    static migrations() {
        return [];
    }

    /**
     * Deletes records from the database table that match the given conditions.
     *
     * @param {Object|any} conditions - The conditions to match records against.
     * If not an object, it will be converted to an object using the primary key.
     * @throws {TypeError} - If conditions is not an object and cannot be converted.
     */
    static delete(conditions) {
        if (conditions && !type(conditions, "object")) {
            conditions = { [this.primaryKey]: conditions };
        }
        const sql = new ModelSQLBuilder(this).delete(conditions).build();
        return this.db.run(sql.statement, sql.args);
    }

    static count(conditions = {}) {
        const sql = new ModelSQLBuilder(this).count(conditions).build();
        return this.db.get(sql.statement, sql.args).count;
    }

    static exists(conditions = {}) {
        return new ModelSQLBuilder(this).where(conditions).exists();
    }

    static max(property, conditions = {}) {
        console.log(this.db);
        return this.db.max(this.tableName, property, conditions);
    }

    static sum(property, conditions = {}) {
        return this.db.sum(this.tableName, property, conditions);
    }

    static select(...columns) {
        if (!columns.length) columns = ["*"];
        return new ModelSQLBuilder(this).select(...columns);
    }

    static pluck(prop) {
        return new ModelSQLBuilder(this).select(prop);
    }

    static where(conditions, options) {
        return new ModelSQLBuilder(this).select("*").where(conditions);
    }

    static all(limit, offset, queue = false) {
        return new ModelSQLBuilder(this).select("*").limit(limit).offset(offset).all();
    }

    static insert(data) {
        return new ModelSQLBuilder(this).insert(data).save();
    }

    static insertMany(data, prepared = null) {
        if (!prepared) {
            const sql = new ModelSQLBuilder(this).insert(data[0]).build();
            const { statement, args } = sql;
            console.log(this.db);
            prepared = this.db.prepare(statement);
        }
        const insertMany = this.db.transaction((records) => {
            for (const record of records) {
                const data = Array.isArray(record) ? record : Object.values(record);
                prepared.run(...data);
            }
        });
        return this.Collection(insertMany(data));
    }

    static fromId(id) {
        return new this(this.db.first(this.tableName, ["*"], { [this.primaryKey]: id }));
    }

    static fromPrimary(primary) {
        return new this(this.db.first(this.tableName, ["*"], { [this.primaryKey]: primary }));
    }

    static find(conditions, options) {
        if (conditions && !type(conditions, "object")) {
            conditions = { [this.primaryKey]: conditions };
        }
        return new ModelSQLBuilder(this).where(conditions);
    }

    static formOptions(label, value) {
        const l = label || this.primaryLabel;
        const v = value || this.primaryId;
        return Promise.resolve(this.select(`${l} AS label, ${v} AS value`).all());
    }

    static form(data) {
        if (data instanceof Model) data = data.toJson();
        return FormBuilder.buildFromSchema(this.schema, data);
    }

    form() {
        return FormBuilder.buildFromSchema(this.static.schema, this.toJson());
    }
    static get hasOne() {
        return {};
    }

    static get hasMany() {
        return {};
    }

    static get belongsTo() {
        return {};
    }

    static get hasProperty() {
        return {};
    }

    static get schema() {
        return {};
    }

    static get properties() {
        return Object.keys(this.schema);
    }

    static get rules() {
        return {};
    }

    static get format() {
        return {};
    }

    static get with() {
        return [];
    }

    static get appends() {
        return [];
    }

    static initialize() {
        const self = this;
        this.index++;
        //Initialize the static model
        if (!this.key) this.key = normalCase(this.tableName);
        if (!this.foreignKey) this.foreignKey = this.key + "_" + this.primaryKey;
        if (!this.localKey) this.localKey = this.primaryKey;
        //Set the initializedf flag

        this.component.tagName = dashed(this.name);

        this.component.attributes = {
            id(model) {
                return self.component.tagName + "-" + model[model.primaryKey];
            }
        };

        if (!this.primaryLabel) {
            let primaryLabel = ["name", "key", "label"].filter((k) => Object.keys(this.schema).includes(k));

            for (let property in this.schema) {
                if (this.schema[property].primaryLabel) {
                    primaryLabel = this.schema[property].primaryLabel;
                }
            }

            this.primaryLabel = primaryLabel;
        }

        if (this.preparedStatements) {
            for (const [key, value] of Object.entries(this.preparedStatements)) {
                this._prepared[key] = value;
            }
        }

        const count = this.count();
        if (count == 0 && this.seed) {
            const seed = this.seed();
            this.insertMany(seed);
            this.onDBConnect("insertMany", seed);
        }

        if (this.afterInitialize) this.afterInitialize();

        this.initialized = true;
    }

    static onDBConnect(job, args) {}

    static useDatabase(db) {
        this.db = db;
        if (db.async) {
            this.async = true;
        }
    }

    static import(data) {
        const self = this;
        const schema = this.schema;
        const columns = Object.keys(schema);

        function isMultipleRecords(d) {
            //if not an array
            if (!Array.isArray(d)) return false;
            //if not all elements are objects
            if (d.map((r) => type(r, "object")).includes(false)) return false;
            return true;
        }

        if (isMultipleRecords(data)) {
            return data.map((r) => self.import(r));
        }

        //Import Single record

        const imported = [];
        const record = new this();

        for (let key of columns) {
            let importConfig = schema[key].import || {};
            if (importConfig.key && data[importConfig.key]) {
                record[key] = data[importConfig.key];
                imported.push(key);
            }
        }

        for (let key of columns) {
            if (imported.includes(key)) continue;
            let importConfig = schema[key].import || {};
            if (importConfig.run) {
                record[key] = importConfig.run(data);
                imported.push(key);
            }

            if (importConfig.exit && importConfig.exit(data)) {
                return null;
            }
        }

        record.save();

        return record;
    }

    constructor(data = {}, options = {}) {
        super();

        //If passed data is a model, convert it to json
        if (data instanceof Model) data = data.toJson();

        //Save the arguments To allow for resetting it later
        this.#args = [data, options];

        //If the static model has not been initialized, initialize it
        if (!this.static.initialized) this.static.initialize();

        //Set DB
        this.db = this.static.db;
        if (this.db.async) this.async = true;

        //Set the index based on instantiation and increment static count
        this.protected.index = this.static.index;
        this.static.index++;

        const _with = options.with || this.static.with;
        //Initialize the protected properties
        this.#required = new DistinctArray();
        this.protected.changed = new DistinctArray();
        this.protected.relatedChanged = new DistinctArray();
        this.protected.with = new DistinctArray(..._with);
        this.protected.appends = new DistinctArray(...this.static.appends);
        this.#changed = new DistinctArray();

        //Create the validator
        // this.errors = new ValidationErrors(this);

        //Unenumerize the object
        setEnumerability(this, [], false);

        //Populate from the options object
        if (options.with) this.protected.with.push(...options.with);
        if (options.appends) this.protected.appends.push(...options.appends);
        if (options.collection) this.collection = options.collection;

        //if model is part of a collection
        if (options.parent) this.parent = options.parent;

        //save source data
        this._source = data;

        //If data exists but and is number, assume it is the primary key
        if (data && type(data, "number")) return this.static.fromId(data);
        //If passed data is not an object, assume it is the primary key
        if (!type(data, "object")) {
            data = { [this.primaryKey]: data };
        }

        //Initialize the model instance
        this.initialize(data);
    }

    setParent(parent) {
        this.parent = parent;
    }

    hasColumn(field) {
        return this.static.properties.includes(field);
    }

    get data() {
        return this.#data;
    }

    set data(v) {
        return false;
    }

    get required() {
        return this.#required;
    }

    get exists() {
        const primaryKey = this.static.existsKey || this.static.primaryKey;
        return this[primaryKey] && !this.deleted ? true : false;
    }

    get protected() {
        return this.#protected;
    }

    //Get difference between provided data and model data.

    #diff(data) {
        const diff = {};
        let count = 0;
        for (let prop in data) {
            if (this.#data[prop] !== undefined && this.#data[prop] !== data[prop]) {
                diff[prop] = data[prop];
                count++;
            }
        }
        return count ? diff : null;
    }

    //Delete model record from database.

    delete() {
        const { primaryKey } = this;
        if (!this.exists) return;
        if (this.beforeDelete) this.beforeDelete();
        const onComplete = (response) => {
            this.deleted = true;
            this.emit("deleted", this);
            if (this.collection) this.collection.delete(this);
            if (this.afterDelete) this.afterDelete();
            return response;
        };
        if (this.async) {
            return this.db.delete(this.static.tableName, { [primaryKey]: this[primaryKey] }).then(onComplete);
        } else {
            const resp = this.db.delete(this.static.tableName, { [primaryKey]: this[primaryKey] });
            return onComplete(resp);
        }
    }

    /**
     *
     * Reset model to state. It was called in.
     */

    reset(data = {}) {
        this.fill(data);
        this.emit("reset");
    }

    update(data) {
        this.fill(data);
        this.emit("updated");
    }

    /**
     * Save current model data to database.
     */

    save() {
        const { primaryKey } = this;
        const schema = this.static.schema;
        let data = { ...this.#data };
        // console.log(this.#data);
        let saveType = "create";

        //If beforeSave hook is set
        if (this.beforeSave) data = this.beforeSave(data);

        //Prepare data for db
        for (let prop in data) {
            if (schema[prop] && schema[prop].type == "json") {
                //If property has JSON type in schema serialize for save
                if (type(data[prop], "object") || type(data[prop], "array")) data[prop] = JSON.stringify(data[prop]);
            }
        }

        const onComplete = () => {
            this.static.emit(`${saveType}d`, this);
            this.emit("saved", this.toJson());
            this.#changed.reset();
            this.saved = true;
            if (this.afterSave) this.afterSave();
            return;
        };

        if (this.exists) {
            //if data exists update
            if (this.beforeUpdate) data = this.beforeUpdate(data);

            if (this.hasColumn("updated_at")) {
                data.updated_at = new Date().toISOString();
            }
            if (this.queueOps) {
                this.db.queue({
                    action: "run",
                    statement: new ModelSQLBuilder(this.static)
                        .update(data)
                        .where({ [primaryKey]: this[primaryKey] })
                        .build().statement
                });
            } else if (this.async) {
                return this.db.update(this.static.tableName, data, { [primaryKey]: this[primaryKey] }).then(() => {
                    this.saveRelated().then(onComplete);
                });
            } else {
                const resp = this.db.update(this.static.tableName, data, { [primaryKey]: this[primaryKey] });
                this.saveRelated();
                return onComplete();
            }
        } else {
            if (this.beforeCreate) data = this.beforeCreate(data);
            if (this.hasColumn("created_at")) {
                data.created_at = new Date().toISOString();
            }
            if (this.queueOps) {
                this.db.queue({
                    action: "run",
                    statement: new ModelSQLBuilder(this.static).insert(data).statement
                });
            } else if (this.async) {
                return this.db.insert(this.static.tableName, data).then((insert) => {
                    this[primaryKey] = insert.lastInsertRowid;
                    return this.saveRelated().then(onComplete);
                });
            } else {
                const resp = this.db.insert(this.static.tableName, data);
                this[primaryKey] = resp.lastInsertRowid;
                this.saveRelated();
                return onComplete();
            }
        }
    }

    saveRelated() {
        const { relationships } = this;

        if (empty(relationships)) return Promise.resolve();

        const saving = [];

        for (let relationship in relationships) {
            const related = relationships[relationship];
            switch (related.type) {
                case "hasOne":
                    this[relationship][this.foreignKey] = this[this.primaryKey];
                    if (this[relationship].isDirty()) {
                        saving.push(this[relationship].save());
                    }
                    break;
                case "hasMany":
                    if (this[relationship].isDirty()) {
                        this[relationship].save();
                    }
                    break;
            }
            //  console.log( 'RELATIONSHIP', relationship, related.type, this[relationship] );
        }

        return this.async ? Promise.all(saving).then(resolve) : saving;
    }

    /**
     * Pull new data from data base
     */

    pull() {
        if (!this.exists) return;
        if (this.async) {
            return this.db
                .first(this.static.tableName, "*", {
                    [this.primaryKey]: this[this.primaryKey]
                })
                .then((data) => {
                    this.fill(data, false, true);
                });
        } else {
            const data = this.db.first(this.static.tableName, "*", {
                [this.primaryKey]: this[this.primaryKey]
            });
            this.fill(data, false, true);
        }
    }

    //Fill model with supplied data

    fill(data = {}, silent, saved) {
        // console.log('FILL', data, this.with);
        const schema = this.static.schema;
        const target = silent ? this.#data : this;
        const skipNonRelated = empty(data) || this.#diff(data);
        //console.log('skipNonRelated', skipNonRelated);
        if (empty(data)) return;

        //Fill the model with the supplied data

        for (const prop in this.#diff(data)) {
            // console.log('fill', prop, data[prop]);
            if (this[prop] !== data[prop]) {
                const propSchema = schema[prop];
                if (propSchema) {
                    if (propSchema.type === "json" && propSchema.collection) {
                        //Shema indicatesthat this property is a Json object or a collection ofmodels.
                        this[prop].update(data[prop], silent, saved);
                    } else {
                        //Else is a simple property so update.
                        // console.log('set', prop, data[prop]);
                        target[prop] = data[prop];
                    }
                    this.protected.changed.remove(prop);
                }
            }
        }

        this.protected.with.forEach((prop) => {
            if (data[prop] && !empty(data[prop])) {
                if (this[prop] instanceof Collection) {
                    this[prop].update(data[prop], silent);
                } else if (this[prop] instanceof Model) {
                    this[prop].fill(data[prop], silent);
                } else if (!empty(data[prop])) {
                    this[prop] = data[prop];
                }
            }
        });

        this.protected.appends.forEach((prop) => {});

        if (saved) this.saved = true;

        this.emit("filled");
    }

    //Get any properties that changed since last save.

    changes() {
        const schema = this.static.schema;
        const changeTmp = this.#changed.slice(0);

        if (!this.exists) {
            return this.toJson();
        }
    }

    /**
     * Returns the model as a JSON object
     * @returns {Object} including any relations
     */

    toJson(only = null) {
        const schema = this.static.schema;
        const json = {};

        if (only) {
            for (const prop in schema) {
                if (only.includes(prop)) {
                    if (schema.type && schema.type == "collection") {
                        json[prop] = this.#data[prop].toJson();
                    } else {
                        json[prop] = this.#data[prop];
                    }
                }
            }
            return json;
        } else {
            for (const prop in schema) {
                if (prop == "collection") continue;
                if (schema.type && schema.type == "collection") {
                    json[prop] = this.#data[prop].toJson();
                } else {
                    json[prop] = this.#data[prop];
                }
            }
        }

        if (this.protected.with.length || this.protected.appends.length) {
            const addonFields = this.protected.with.merge(this.protected.appends);
            for (let prop of addonFields) {
                const accessor = studly(`get_${prop}_attribute`);
                if (typeof this[accessor] === "function") {
                    json[prop] = this[accessor]();
                } else {
                    if (this[prop] && typeof this[prop].toJson === "function") {
                        json[prop] = this[prop].toJson();
                    } else {
                        json[prop] = this[prop];
                    }
                }

                if (json[prop] instanceof Collection || json[prop] instanceof Model) {
                    json[prop] = json[prop].toJson();
                }
            }
        }

        return json;
    }

    hasComponent() {
        return this.component !== undefined;
    }

    createComponent() {
        const { component: cmp } = this.static;
        // console.log(cmp);
        const component = document.createElement(cmp.tagName);
        // console.log(component);
        for (let prop in cmp.attributes) {
            component.setAttribute(
                prop,
                type(cmp.attributes[prop], "function") ? cmp.attributes[prop](this) : cmp.attributes[prop]
            );
        }

        component.addModel(this, { copyToData: true });

        this.component = component;
        return component;
    }

    linkComponent(component) {
        const { component: settings } = this.static;
        // console.log(component);
        if (settings.attributes) {
            for (let prop in settings.attributes) {
                component.setAttribute(
                    prop,
                    type(settings.attributes[prop], "function")
                        ? settings.attributes[prop](this)
                        : settings.attributes[prop]
                );
            }
        }

        component.addModel(this, { copyToData: true });

        this.component = component;
        return component;
    }

    #getProperty(prop) {
        const accessor = studly(`get_${prop}_attribute`);
        if (this[accessor]) return this[accessor](this.#data[prop]);
        return this.#data[prop];
    }

    #setProperty(prop, value, schema) {
        const format = this.static.format[prop];
        const rules = this.static.rules[prop];
        const silent = schema.silent && schema.silent === true;

        if (empty(value)) value = null;

        //If schema contains readonly do not update
        if (schema.readonly && !empty(this[prop])) {
            console.log(
                `Trying to set readonly value of ${prop} to ${value} after already has value of ${this[prop]} in ${this.static.name}!`
            );
            return false;
        }

        if (schema.type == "json" && type(value, "string")) {
            while (type(value, "string")) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    console.log("JSON Parse Error", e);
                    return false;
                }
            }
        }

        if (schema.type == "int" && value !== null) value = parseInt(value);

        if (schema.type == "url" && type(value, "string")) {
            value = encodeURI(value);
        }

        //If property has mutator attribute
        const mutator = studly(`set_${prop}_attribute`);
        if (this[mutator]) value = this[mutator](value);

        //If value has not changed exit
        if (this.#data[prop] === value) return false;

        if (this.ready && Model.debug) console.log("Set Property", this.protected.index, prop, value, schema);

        if (this.collection) {
            if (schema.unique) {
                let match;
                if ((match = this.collection.findIndexBy(prop, value, false, this.index))) {
                    //Value Not unique
                    console.log("Unique Error", this.collection[match], this);
                    if (match !== this.index) this.errors.set(prop, new UniquePropertyError(prop, this, value));
                    return false;
                }
            }
        }

        if (empty(value) && !this.exists && schema.default) {
            value = schema.default;
        }

        //Passed Error Checks so clear errors.
        // if (this.errors.has(prop)) this.errors.clear(prop);
        this.#data[prop] = value;

        if (this.ready && this.#valid && !this.isValid) {
            this.#valid = false;
            if (Model.debug) console.log("NOT VALID NOW");
            this.emit("invalid");
        }

        const updateSchema = this.static.schema.updated_at;
        const createSchema = this.static.schema.created_at;

        if (
            (this.static.properties.includes("updated_at") || this.static.timestamps) &&
            (!updateSchema || updateSchema.generate !== false)
        ) {
            this.#data.updated_at = Date.now();
        }

        if (this.ready) this.#changed.push(prop);

        if (!silent) this.emit("change", prop, value);

        if (this.ready && !this.#valid && this.isValid) {
            this.#valid = true;
            if (Model.debug) console.log("IS VALID NOW");
            this.emit("valid");
        }
    }

    isDirty(prop) {
        if (!prop) return this.#changed.length > 0;
        return this.#changed.includes(prop);
    }

    #initializeProperty(prop, value = null, schema) {
        // console.log('initializeProperty', prop, value, schema);

        const self = this;
        const readonly = schema.readonly;

        if (value === undefined && schema.default) value = schema.default;

        if (schema.type == "json") {
            //JSON Collection
            while (type(value, "string")) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    value = {};
                }
            }

            if (value == null) value = {};

            if (schema.collection) {
                value = schema.collection.Collection(value);
                value.on("change", (instance, iprop, value) => {
                    this.#changed.push(prop);
                    this.emit("change", prop, instance, iprop, value);
                });
            } else {
                //Standard JSON
                //console.log("WATCH", prop, type(value), value);

                Watch.deep(value, (path, value) => {
                    // app.log('Watch Deep Change', path, val);
                    this.emit("change", path, value);
                });
            }
        }

        if (schema.required) this.#required.push(prop);

        if (value == null && schema.generate) {
            const gen = schema.generate.bind(this);
            value = gen();
            // console.log('generated', value);
        }

        if (this[prop] !== undefined) {
            value = this[prop];
            delete this[prop];
        }

        const propertyDef = { enumerable: true };

        propertyDef.get = () => this.#getProperty(prop, schema);
        propertyDef.set = (value) => this.#setProperty(prop, value, schema);

        Object.defineProperty(this, prop, propertyDef);
        //app.log('Defined', prop, value );
        this.#setProperty(prop, value, schema);

        // app.log('Initialized', prop );
    }

    // Initialize a relationship between models based on the specified type, key, value, and schema
    async #initializeRelationship(relationType, key, value, schema) {
        // Extract relevant properties from the model schema
        const self = this;
        const RelatedModel = schema.model;
        const foreignKey = schema.foreignKey || this.foreignKey;
        const localKey = schema.localKey || this.localKey;
        let relation, loadRelationship;

        //console.log(relationType, key, value, schema);

        RelatedModel.useDatabase(this.static.db);

        // Log initialization details for debugging
        //console.log('MODEL INIT RELATIONSHIP', relationType, key, value, schema);

        function attachEvents() {
            // Attach event listeners for change events on the relationship
            relation.on("change", (instance, iprop, rvalue) => {
                if (self.ready) self.protected.relatedChanged.push(key);
                self.emit("change", key, instance, iprop, rvalue);
            });

            // For 'hasMany' relationships, handle 'saved' event to remove the changed flag
            relation.on("saved", () => {
                self.protected.relatedChanged.remove(key);
            });
        }

        // Create the appropriate type of relationship based on the given relationType
        if (relationType === "hasMany") {
            // If it's a 'hasMany' relationship, create a collection
            // console.log('HAS MANY', key, value)
            if (value) {
                relation = RelatedModel.Collection(value);
                relation.setParent(this);
                attachEvents();
            } else {
                loadRelationship = function loadRelationship() {
                    const query = RelatedModel.where({
                        [foreignKey]: self[localKey]
                    });
                    if (schema.orderBy) query.orderBy(schema.orderBy);
                    relation = query.all();
                    relation.setParent(self);
                    attachEvents();
                    return relation;
                };
            }
        } else {
            const _with = RelatedModel.with.slice(0);

            // For Single record create a model instance
            if (relationType === "belongsTo" && schema.localKey) {
            }
            if (value) {
                relation = new RelatedModel(value, { parent: this, with: [] });
                // Set the foreign key if it's not a 'hasMany' relationship
                relation[foreignKey] = this[localKey];
                attachEvents();
            } else {
                loadRelationship = function loadRelationship() {
                    relation = RelatedModel.where(
                        {
                            [foreignKey]: self[localKey]
                        },
                        { parent: self, with: [] }
                    ).first();
                    relation.setParent(self);
                    if (!relation[foreignKey]) relation[foreignKey] = self[localKey];
                    attachEvents();
                    return relation;
                };
            }
        }

        if (loadRelationship && this.protected.with.includes(key)) {
            loadRelationship();
        }

        // Store relationship metadata in the model's relationships object
        this.relationships[key] = { type: relationType, ...schema };

        // Define property getter and setter for the relationship
        Object.defineProperty(this, key, {
            get() {
                //Allow Lazy Load
                if (!relation) loadRelationship();

                return schema.pluck ? relation[schema.pluck] : relation;
            },
            set(data) {
                //console.log('SET RELATION', key, data);
                if (schema.pluck) {
                    relation[schema.pluck] = data;
                }
                if (empty(data)) {
                    relation.reset();
                    if (relationType !== "hasMany") {
                        relation[foreignKey] = this[localKey];
                    }
                    return;
                }

                // Handle different data types: RelatedModel instance, array, or object
                if (data instanceof RelatedModel) {
                    if (relationType === "hasMany" && Array.isArray(data)) {
                        relation.update(data);
                    } else if (relationType !== "hasMany" && typeof data === "object") {
                        relation.reset(data);
                    } else {
                        relation.push(data);
                    }
                } else {
                    // Throw an error if the data type is not allowed in the relationship
                    throw new Error(
                        `Trying to add Model of ${data.constructor.name} to relation when only ${RelatedModel.name} allowed`
                    );
                }

                // Update the foreign key and track changes if the model is ready
                if (this.ready) this.protected.relatedChanged.push(key);
                if (relationType !== "hasMany") relation[foreignKey] = this[localKey];
            }
        });
    }

    initialize(data = {}) {
        //console.log('INITIALIZE MODEL', data);
        const schema = this.static.schema;

        this.primaryKey = this.static.primaryKey;
        this.foreignKey = this.static.foreignKey;
        this.localKey = this.static.localKey;
        this.primaryLabel = this.static.primaryLabel;
        // console.log(data);
        for (let prop in schema) {
            const propValue = data[prop];
            // console.log(prop, propValue);
            this.#initializeProperty(prop, data[prop] || undefined, schema[prop]);
        }

        if (this.static.timestamps) {
            this.#initializeProperty("created_at", data.created_at || null, { type: "timestamp", silent: true });
            this.#initializeProperty("updated_at", data.updated_at || null, { type: "timestamp", silent: true });
            this.#initializeProperty("deleted_at", data.deleted_at || null, { type: "timestamp" });
        }

        //Setup Accessors
        if (this.protected.with.length || this.protected.appends.length) {
            //* Include "With" and "Appends" Attribute merged Accessors
            const addonFields = this.protected.with.merge(this.protected.appends);

            for (let prop of addonFields) {
                //Get Accessor Name
                const accessor = studly(`get_${prop}_attribute`);
                //If Accessor Exists and not in schema set it up
                if (type(this[accessor], "function") && !schema[prop]) {
                    Object.defineProperty(this, prop, {
                        get: () => this[accessor](),
                        set: () => false
                    });
                }
            }
        }

        //If Id is set try to pull record from DB
        if (!empty(data) && data[this.primaryKey]) {
            this.pull();
        }

        //Initialize Relationships
        let relatedKey;
        const relationTypes = ["hasOne", "hasMany", "hasProperty", "belongsTo"];
        for (let relationType of relationTypes) {
            if (Object.keys(this.static[relationType]).length) {
                for (relatedKey in this.static[relationType]) {
                    this.#initializeRelationship(
                        relationType,
                        relatedKey,
                        data[relatedKey],
                        this.static[relationType][relatedKey]
                    );
                }
            }
        }

        // app.log('data initialized ', this.#data)

        this.ready = true;
        if (this.onReady) this.onReady();
    }
}

EventEmitter.bind(Model);

export default Model;
