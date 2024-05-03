import EventEmitter from '../../Event/Emitter.mjs';
import Collection from './Collection.mjs';
import DistinctArray from '../../DataTypes/DistinctArray.mjs';
import { type, empty, equals, exists } from '../../Util/Core.mjs';
import { normalCase, studly, unStudly, pascalCase } from '../../Util/String.mjs';
import { setEnumerability } from '../../Util/Object.mjs';
import LookupChain from '../LookupChain';

class Model extends EventEmitter {

    static key = null;
    static tableName = '';
    static primaryKey = 'id';
    static foreignKey = null;
    static debug = false;
    static index = 0;

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

    get static() {
        return this.constructor;
    }

    static Collection(data = []) {
        if (data == null) data = [];
        debug(data);
        if (!type(data, 'array')) {
            if (Model.debug) console.log(data);
            throw new Error(`Collection ${this.name} must supply array or null ${typeof data} provided`, data);
        }

        return new Collection(data, this);
    }




    static select( ...columns ){
        return new LookupChain( this ).select( ...columns );
    }

    static where( conditions ){
        return new LookupChain( this ).where( conditions );
    }

    static all( limit, offset ){
        return new LookupChain( this ).where( {} ).all( limit, offset );
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
        this.index++;
        //Initialize the static model 
        if (!this.key) this.key = normalCase(this.tableName);
        if (!this.foreignKey) this.foreignKey = this.key + '_' + this.primaryKey;
        //Set the initializedf flag
        this.initialized = true;
    }

    constructor(data = {}, options = {}) {
        super(data);

        //Save the arguments To allow for resetting it later
        this.#args = [data, options];

        //If the static model has not been initialized, initialize it
        if (!this.static.initialized) this.static.initialize();

        this.db = this.static.db;
        //Set the index based on instantiation and increment static count
        this.protected.index = this.static.index;
        this.static.index++;

        //Initialize the protected properties
        this.#required = new DistinctArray();
        this.protected.changed = new DistinctArray();
        this.protected.relatedChanged = new DistinctArray();
        this.protected.with = new DistinctArray(this.static.with);

        //Create the validator
        // this.errors = new ValidationErrors(this);

        //Unenumerize the object
        setEnumerability(this, [], false);

        //Populate from the options object
        if (options.with) this.protected.with.push(...options.with);
        if (options.collection) this.collection = options.collection;
        if (options.parent) this.parent = options.parent;

        this._source = data;

        //If data exists but is not an object, assume it is the primary key
        if (data && !type(data, 'object')) data = { [this.static.primaryKey]: data };

        //Initialize the model instance
        this.initialize(data);


    }

    get data() { return this.#data; }

    set data(v){ return false; }

    get foreignKey() { return this.static.foreignKey; }

    get primary() { return this[this.static.primaryKey]; }

    get required() { return this.#required; }

    get exists() {
        const primaryKey = this.static.existsKey || this.static.primaryKey;
        return (this[primaryKey] && !this.deleted) ? true : false;
    }

    get protected() {
        return this.#protected;
    }

    //Get difference between provided data and model data.

    diff(data) {
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
        this.db.delete(this.static.tableName, { [primaryKey]: this[primaryKey] });
        this.deleted = true;
        this.emit('deleted', this);
        if (this.collection) this.collection.delete(this);

    }

    /**
     * 
     * Reset model to state. It was called in.
     */

    reset(data = {}) {
        const resetModel = new this.constructor(data || this.#args[0]);
        // this.transferEvents(resetModel);
        return resetModel;
    }

    /**
     * Save current model data to database.
     */

    save() {
        const { primaryKey } = this;
        if (this.exists) {
            this.db.update(this.static.tableName, this.#data, { [primaryKey]: this[primaryKey] });
        } else {
            const insert = this.db.insert(this.static.tableName, this.#data);
            this[primaryKey] = insert.lastInsertRowid;
            debug(insert.lastInsertRowid);
            debug(this.foreignKey);
            
        }
        if(!empty(this.relationships)){
            for( let relationship in this.relationships ){
                const related = this.relationships[relationship];
                switch(related.type){
                    case 'hasOne':
                    this[relationship][this.foreignKey] = this[this.primaryKey]
                    this[relationship].save();
                    break;
                }
                debug( 'RELATIONSHIP', relationship, related.type, this[relationship] );
            }
        }
        this.saved = true;
    }

    /**
     * Pull new data from data base
     */

    pull() {
        const data = this.db.get(this.tableName, { 
            [this.primaryKey]: this[this.primaryKey]
        });

        this.fill(data);
    }

    //Fill model with supplied data

    fill(data = {}, silent, saved) {
        debug('FILL', data, this.with);
        const schema = this.static.schema;
        const target = silent ? this.#data : this;
        const skipNonRelated = empty(data) || this.diff(data);

        if (skipNonRelated) return;

        //Fill the model with the supplied data

        for (const prop in data) {
            if (this[prop] !== data[prop]) {
                const propSchema = schema[prop];
                if (propSchema) {
                    if (propSchema.type === 'json' && propSchema.collection) {
                        //Shema indicatesthat this property is a Json object or a collection ofmodels.
                        this[prop].update(data[prop], silent, saved);
                    } else {
                        //Else is a simple property so update.
                        target[prop] = data[prop];
                    }
                    this.protected.changed.remove(prop);
                }
            }
        }

        this.with.forEach((prop) => {
            if (data[prop] && !empty(data[prop])) {
                if (this[prop] instanceof Collection) {
                    this[prop].update(data[prop], silent);
                } else if (this[_with] instanceof ModelBase) {
                    this[prop].fill(data[prop], silent);
                } else if (!empty(data[prop])) {
                    this[prop] = data[prop];
                }
            }
        });

        if (saved) this.saved = true;

        this.emit('filled');
    }

    //Get any properties that changed since last save.

    changes(){
        const schema = this.static.schema;
        const changeTmp = this.#changed.slice(0);

        if(!this.exists){
            return this.toJson();
        }
    }

    /**
     * Returns the model as a JSON object
     * @returns {Object} including any relations
     */

    toJson() {
        const schema = this.static.schema;
        const json = {};

        for (const prop in schema) {
            if (schema.type && schema.type == 'collection') {
                json[prop] = this.#data[prop].toJson();
            } else {
                json[prop] = this.#data[prop];
            }
        }

        if (this.static.with.length) {
            for (let prop of this.static.with) {
                const accessor = studly(`get_${prop}_attribute`);
                if (this[accessor] !== undefined) {
                    json[prop] = this[prop];
                } else {
                    if (this[prop] && typeof this[prop].toJson === 'function') {
                        json[prop] = this[prop].toJson();
                    } else {
                        json[prop] = this[prop];
                    }
                }
            }
        }
        

        return json;
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

        //If schema contains readonly do not update
        if (schema.readonly && !empty(this[prop])) {
            debug(`Trying to set readonly value of ${prop} to ${value} after already has value of ${this[prop]} in ${this.static.name}!`);
            return false;
        }

        if (schema.type == 'int' && value !== null)
            value = parseInt(value);

        //If property has mutator attribute
        const mutator = studly(`set_${prop}_attribute`);
        if (this[mutator]) value = this[mutator](value);

        //If value has not changed exit
        if (this.#data[prop] === value) return false;

        if (this.ready && Model.debug) debug('Set Property', this.protected.index, prop, value, schema);

        if (this.collection) {
            if (schema.unique) {
                let match;
                if (match = this.collection.findIndexBy(prop, value, false, this.index)) {
                    //Value Not unique
                    debug('Unique Error', this.collection[match], this);
                    if (match !== this.index) this.errors.set(prop, new UniquePropertyError(prop, this, value));
                    return false;
                }
            }
        }

        //Passed Error Checks so clear errors.
        // if (this.errors.has(prop)) this.errors.clear(prop);
        this.#data[prop] = value;

        const updateSchema = this.static.schema.updated_at;
        const createSchema = this.static.schema.created_at;

        if ((this.static.properties.includes('updated_at') || this.static.timestamps)
            && (!updateSchema || updateSchema.generate !== false)) {
            this.#data.updated_at = Date.now();
        }

        if (this.ready) this.#changed.push(prop);

        if (!silent) this.emit('change', prop, value);

        if (this.ready && !this.#valid && this.isValid) {
            this.#valid = true;
            if (Model.debug) console.log('IS VALID NOW');
            this.emit('valid');
        }

    }

    #initializeProperty(prop, value = null, schema) {

        debug('initializeProperty', prop, value, schema);

        const self = this;
        const readonly = schema.readonly;


        if (schema.type == 'json') {
            //JSON Collection
            if (schema.collection) {
                value = schema.collection.Collection(value);
                value.on('change', (instance, iprop, value) => {
                    this.#changed.push(prop);
                    this.emit('change', prop, instance, iprop, value);
                });
            } else {
                //Standard JSON

                Watch.deep(value || {}, (path, value) => {
                    // app.log('Watch Deep Change', path, val);
                    this.emit('change', path, value);
                });
            }
        }

        if (schema.required) this.#required.push(prop);


        if (value == null && schema.generate) {
            const gen = schema.generate.bind(this);
            value = gen();
            debug('generated', value);
        }

        if (value === null && schema.default !== undefined) value = schema.default;

        if (this[prop] !== undefined) {
            value = this[prop];
            delete this[prop];
        }

        const propertyDef = { enumerable: true };

        propertyDef.get = () => this.#getProperty(prop, schema);
        propertyDef.set = (value) => this.#setProperty(prop, value, schema);

        Object.defineProperty(this, prop, propertyDef);
        //app.log('Defined', prop, value );
        this.#setProperty(prop, value, schema)

        // app.log('Initialized', prop );
    }


    // Initialize a relationship between models based on the specified type, key, value, and schema
    #initializeRelationship(type, key, value, schema) {
        // Extract relevant properties from the model schema
        const RelatedModel = schema.model;
        const foreignKey = schema.foreignKey || this.foreignKey || this.static.foreignKey;
        const localKey = schema.localKey || this.static.primaryKey;
        let relation;

        // Log initialization details for debugging
        debug('MODEL INIT RELATIONSHIP', type, key, value, schema);

        // Create the appropriate type of relationship based on the given type
        if (type === 'hasMany') {
            // If it's a 'hasMany' relationship, create a collection
            relation = RelatedModel.Collection(value);
            relation.setParent(this);
        } else {
            // For 'belongsTo' and 'hasOne', create a model instance
            if(value){
            relation = new RelatedModel(value || (type === 'belongsTo' && this[schema.localKey]), { parent: this });
            }else{
                relation =  RelatedModel.where({
                    [this.foreignKey]: this[this.primaryKey]
                }).first();

                debug(relation);
            }
            // Set the foreign key if it's not a 'hasMany' relationship
            if (type !== 'hasMany') {
                relation[foreignKey] = this[localKey];
            }
        }

        // Attach event listeners for change events on the relationship
        relation.on('change', (instance, iprop, rvalue) => {
            if (this.ready) this.protected.relatedChanged.push(key);
            this.emit('change', key, instance, iprop, rvalue);
        });

        // For 'hasMany' relationships, handle 'saved' event to remove the changed flag
        if (type === 'hasMany') {
            relation.on('saved', () => {
                this.protected.relatedChanged.remove(key);
            });
        }

        // Store relationship metadata in the model's relationships object
        this.relationships[key] = { type, ...schema };

        // Define property getter and setter for the relationship
        Object.defineProperty(this, key, {
            get() {
                return relation;
            },
            set(data) {
                debug('SET RELATION', key, data);
                if (empty(data)) {
                    relation.reset();
                    if (type !== 'hasMany') {
                        relation[foreignKey] = this[localKey];
                    }
                    return;
                }

                // Handle different data types: RelatedModel instance, array, or object
                if (data instanceof RelatedModel) {
                    if (type === 'hasMany' && Array.isArray(data)) {
                        relation.update(data);
                    } else if (type !== 'hasMany' && typeof data === 'object') {
                        relation.reset(data);
                    } else {
                        relation.push(data);
                    }
                } else {
                    // Throw an error if the data type is not allowed in the relationship
                    throw new Error(`Trying to add Model of ${data.constructor.name} to relation when only ${RelatedModel.name} allowed`);
                }

                // Update the foreign key and track changes if the model is ready
                if (this.ready) this.protected.relatedChanged.push(key);
                if (type !== 'hasMany') relation[foreignKey] = this[localKey];
            }
        });
    }


    initialize(data = {}) {
        const schema = this.static.schema;

        this.primaryKey = this.static.primaryKey || 'id';

        for (let prop in schema) {
            this.#initializeProperty(prop, data[prop] || null, schema[prop]);
        }

        if (this.static.timestamps) {
            this.#initializeProperty('created_at', data.created_at || null, { type: 'timestamp', silent: true });
            this.#initializeProperty('updated_at', data.updated_at || null, { type: 'timestamp', silent: true });
            this.#initializeProperty('deleted_at', data.deleted_at || null, { type: 'timestamp' });
        }

        if (this.protected.with.length) {

            //* Include "With" Attribute Accessors

            for (let prop of this.protected.with) {
                const accessor = studly(`get_${prop}_attribute`);

                if (type(this[accessor], 'function') && !schema[prop]) {
                    Object.defineProperty(this, prop, {
                        get: () => this[accessor](this.#data[prop]),
                        set: () => false
                    });
                }
            }
        }

        let relatedKey;
        if (Object.keys(this.static.hasMany).length) {
            for (relatedKey in this.static.hasMany) {
                //if(this.protected.with.has(relatedKey))
                this.#initializeRelationship('hasMany', relatedKey, data[relatedKey], this.static.hasMany[relatedKey]);
            }
        }

        if (Object.keys(this.static.hasOne).length) {
            // debug(this.static.hasOne);
            for (relatedKey in this.static.hasOne) {
                //if (this.protected.with.has(relatedKey))
                this.#initializeRelationship('hasOne', relatedKey, data[relatedKey], this.static.hasOne[relatedKey]);
            }
        }

        if (Object.keys(this.static.belongsTo).length) {
            for (relatedKey in this.static.belongsTo) {
                // if (this.protected.with.has(relatedKey))
                this.#initializeRelationship('belongsTo', relatedKey, data[relatedKey], this.static.belongsTo[relatedKey]);
            }
        }

        // app.log('data initialized ', this.#data)
        this.ready = true;
        if (this.onReady) this.onReady();

    }
}

export default Model;