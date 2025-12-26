import { default as Util, type, empty } from "../../Util/Core.mjs";
import * as Condition from "../../Util/Condition.mjs";
import DistinctArray from "../../DataTypes/DistinctArray.mjs";
//import { PackageFile, FileCollection } from './PackageFile.mjs';
import Emitter from "../../Event/Emitter.mjs";

const studly = Util.String.studly;
const unStudly = Util.String.unStudly;

/**
 * SuperCollection class represents a collection of Model instances with additional functionality.
 * @extends Array
 */

class SuperCollection extends Array {
    /**
     * Array of primary key names used for identifying models within the collection.
     * @type {Array.<string>}
     * @static
     */

    static primaryKeys = ["id", "uuid"];

    #indexes = {};
    #options = {};
    #parent = null;
    #changed = new DistinctArray();
    #unique = new DistinctArray();

    /**
     * The Model class associated with this collection.
     * @type {Model}
     */

    Model;

    /**
     * The primary key used for identifying models within the collection.
     * @type {string}
     */

    primaryKey = "id";

    /**
     * Array of exceptions encountered during collection operations.
     * @type {Array.<*>}
     */

    exceptions = [];

    /**
     * Flag indicating whether the collection should emit events silently.
     * @type {boolean}
     */

    silent = false;

    /**
     * Flag indicating whether changes to the collection should be automatically saved.
     * @type {boolean}
     */

    autoSave = false;

    /**
     * Flag indicating whether this object is a collection.
     * @type {boolean}
     */

    isCollection = true;

    /**
     * Initializes the collection with the provided Model class and options.
     * @param {Model} Model - The Model class associated with this collection.
     * @param {Object} [options={}] - Additional options for customizing the collection behavior.
     * @returns {SuperCollection} Returns the initialized collection.
     */

    of(Model, options = {}) {
        Emitter.bind(this);

        if (Model.collectionOptions) {
            options = Util.Object.merge(Model.collectionOptions, options);
        }

        this.Model = Model;
        this.#options = options;

        this.defaultSort =
            Model.collectionDefaultSort ||
            function (a, b) {
                return 1;
            };

        if (this.length) {
            //console.log(this);
            //If collection contains items sorted according to the default sorting
            this.sort();
            for (let i = 0; i < this.length; i++) {
                if (empty(this[i])) continue;
                this[i] = this.#prepare(this[i]);
                this.emit("insert", this[i], i);
            }
        }

        this.#initialize();

        this.ready = true;
        return this;
    }

    /**
     * Checks if the collection has any dirty (changed) instances.
     * @returns {boolean} Returns true if there are dirty instances, otherwise false.
     */

    isDirty() {
        return this.#changed.length > 0;
    }

    /**
     * Gets the array of dirty (changed) instances in the collection.
     * @returns {DistinctArray} Returns an array containing the dirty instances.
     */

    get dirty() {
        return this.#changed;
    }

    /**
     * Prepares a record for insertion into the collection.
     * @private
     * @param {*} record - The record to prepare.
     * @returns {Model} Returns the prepared Model instance.
     */

    setParent(parent) {
        this.#parent = parent;
    }

    getParent() {
        return this.#parent;
    }

    hasParent(parent) {
        return this.#parent ? true : false;
    }

    has(instance) {
        const primaryKey = instance[this.primaryKey];
        if (primaryKey === null) return -1;
        if (this.#indexes[this.primaryKey].indexOf(primaryKey) !== -1) {
        }
    }

    create(data = {}) {
        const instance = this.#prepare(data);
        const idx = this.insert(instance);
        // console.log('create',idx);
        this.#changed.push(idx);
        return instance;
    }

    changed(reset) {
        const changed = this.extract(this.#changed);
        if (reset) this.#changed.reset();
        return changed;
    }

    hasIndex(key) {
        return this.#indexes[key] ? true : false;
    }

    searchIndex(key, value) {
        return this.#indexes[key].indexOf(value);
    }

    searchIndexAll(key, value) {
        return Util.Array.indexesOf(value, this.#indexes[key]);
    }

    #prepare(record) {
        //console.log('#prepare', record);
        const instance =
            record instanceof this.Model
                ? record
                : new this.Model(record, { ...this.#options, ...{ parent: this.#parent } });
        instance.parent = this.#parent;
        instance.collection = this;
        instance.on("change", (prop, value) => {
            this.#changed.push(instance);
            if (!this.silent) this.emit("change", instance, prop, value);
        });
        //console.log('prepare complete');
        return instance;
    }

    /**
     * Initializes the collection based on the Model schema and options.
     * @private
     */

    #initialize() {
        const { schema } = this.Model;
        const { indexes = [] } = this.#options;
        for (const key in schema) {
            if (schema[key].primaryKey) this.primaryKey = key;
            if (schema[key].unique || schema[key].primaryKey) this.#unique.push(key);
            if (schema[key].index || schema[key].primaryKey || schema[key].unique) this.#indexes[key] = [];
        }
        if (!this.primaryKey) this.primaryKey = this.#options.primaryKey || this.Model.primaryKey || null;
        this.#indexes[this.primaryKey] = [];
        this.sort();
    }

    insert(instance, index = null) {
        // Determine the index for insertion if not provided
        if (index === null) {
            index = this.getSortIndex(instance);
        }

        // Check if the instance already exists in the collection
        const primaryKey = instance[this.primaryKey];
        const exists = instance.exists && this.#indexes[this.primaryKey]?.includes(primaryKey);

        // Set up event listeners for the instance
        this.setupInstanceListeners(instance);

        // Insert the instance at the specified index
        if (Number.isInteger(index)) {
            this.shiftRight(1, index);
            this[index] = instance;
        }

        // Update the changed list and indexes
        if (exists) {
            this.#changed.push(instance);
        } else {
            this.#changed.push(instance);
            for (const prop in this.#indexes) {
                this.#indexes[prop][index] = instance[prop];
            }
        }

        // Emit events for the insertion
        if (!this.silent) {
            this.emit("change", instance, "insert");
        }
        this.emit("insert", instance, index);

        return index;
    }

    setupInstanceListeners(instance) {
        instance.on("change", (prop, value) => {
            if (this.hasIndex(prop)) {
                this.#indexes[prop][this.indexOfItem(instance)] = value;
            }
            this.#changed.push(instance);
            if (!this.silent) this.emit("change", instance, prop, value);
        });

        instance.on("saved", () => {
            const idx = this.#changed.findIndex((inst) => inst === instance);
            this.#changed.splice(idx, 1);
        });

        instance.on("deleted", () => {
            this.delete(instance);
        });
    }

    delete(instance) {
        const index = this.indexOf(instance);
        if (index !== -1) {
            // Remove the instance from the collection
            this.splice(index, 1);

            // Remove the instance from indexes
            for (const prop in this.#indexes) {
                this.#indexes[prop].splice(index, 1);
            }

            // Remove event listener
            instance.removeListener("change", "collectionChange");

            // Emit delete event if not silent
            if (!this.silent) {
                this.emit("delete", instance, index);
            }

            // Mark the instance as deleted
            instance.deleted = Date.now();

            // Shift remaining elements in the collection
            for (let i = index; i < this.length; i++) {
                this[i] = this[i + 1];
            }
            this.pop();

            // Remove instance index from indexes
            for (const prop in this.#indexes) {
                this.#indexes[prop].splice(index, 1);
            }

            // Emit delete event for the instance
            this.emit("change", instance, "deleted");
            this.emit("change", instance, "delete", instance.deleted);
            instance.removeListener("change", "collectionChange");
            this.emit("delete", instance, index);
        }
    }

    getSortIndex(item, sorter = this.defaultSort) {
        let i = -1;
        let s = 1;
        while (i < this.length && s == 1) {
            i++;
            s = sorter(item, this[i]);
        }
        return i;
    }

    shiftRight(increment, startAt = 0, endAt = this.length - 1) {
        for (let i = endAt; i >= startAt; i--) {
            this[i + increment] = this[i];
        }
    }

    shiftLeft(increment, startAt = 0, endAt = this.length - 1) {
        const newLength = this.length - increment;
        for (let i = startAt; i <= endAt; i++) {
            if (i < newLength) {
                this[i] = this[i + increment];
            }
        }
        this.length = newLength;
    }

    indexOfItem(item) {
        for (let i = 0; i < this.length; i++) {
            if (this[i] === item) return i;
        }
    }

    push(...items) {
        const idxs = items.map((item) => {
            return this.insert(this.#prepare(item));
        });
        return idxs.length == 1 ? idxs[0] : idxs;
    }

    unshift(...items) {
        items = items.map((item) => this.#prepare(item));
        return super.unshift(...items);
    }

    saveAll(force) {
        const all = this.Model.all();
        for (let i = 0; i < all.length; i++) {
            all[i].save();
        }
    }

    makePutPatch() {
        const pk = this.Model.primaryKey;
        const patch = { insert: [], update: [], delete: [] };
        // console.log('Make Patch', this.#changed);
        const inserts = [];
        const updates = [];
        this.#changed.slice(0).forEach((inst) => {
            const changes = inst.getChanges();
            /// console.log('changes',changes);
            if (inst._delete) {
                patch.delete.push(inst[this.Model.primaryKey]);
            } else if (!inst.exists) {
                patch.insert.push(changes);
                inserts.push(inst);
            } else {
                patch.update.push(changes);
            }
        });
        // console.log('patch',patch);

        if (patch.insert.length + patch.update.length + patch.delete.length > 0) {
            this.Model.patch(patch).then((response) => {
                //   console.log(response);

                if (response.insert && response.insert.length) {
                    for (let i = 0; i < inserts.length; i++) {
                        inserts[i].afterSave(response.insert[i], "created");
                        this.#changed.remove(inserts[i]);
                    }
                }

                if (response.update && response.update.length) {
                    for (let i = 0; i < response.update.length; i++) {
                        const update = response.update[i];
                        const instance = this.findBy(pk, update[pk]);
                        instance.afterSave(update, "updated");
                        this.#changed.remove(instance);
                    }
                }

                if (response.delete && response.delete.length) {
                    for (let i = 0; i < response.delete.length; i++) {
                        const instance = this.findBy(pk, esponse.delete[i]);
                        if (instance) {
                            instance.delete();
                            this.#changed.remove(instance);
                        }
                    }
                }

                this.emit("saved");
            });
        }
        return patch;
    }
}

export class CollectionArray extends SuperCollection {
    /*
    #validate( instance ){

        const { Model } = this;/
        //console.log('Validate', instance );

        if(instance.bypass) return true;

        const exists = this.findIndexBy( this.primaryKey, instance[this.primaryKey] );

        //console.log('exists',exists);

        if( this.#unique.length ){
  
            for( const unique of this.#unique ){
                const idx =  this.#indexes[unique].indexOf(instance[unique]);

                //Unique Validation excluding existing record
                if( instance[unique] !== null && idx !== -1 && idx !==  exists ){
                    console.error(`Trying to add duplicate unique property to collection ${unique} `);
                    this.emit('exception', 'not unique', instance, null );
                    return false;
                }
            }
        }

        //if(!instance.collection || instance.collection !== this ){
            if( Model.collectionValidation && this.ready ){
                const validator = Model.collectionValidation.bind(this);
                if( !validator(instance) ) return false;
            }
        //}

      //  console.log('Validated');
        return true;
    }

    preValidate(instance){
        return this.#validate(instance);
    }

    

    #update( instance, index=null ){
        console.log('update');
        if(  index === null ){
            const pk = instance[this.primaryKey];
            index = this.findIndexBy( this.primaryKey, pk );
        }
       console.log(index);
       // if( this[index]?.diff( instance ) ){
       //     this[index].fill(instance);
      //  }else if(index == null){
       //     this.push(instance);
      //  }

        //Set Indexes
        for( let prop in this.#indexes ) this.#indexes[prop][index] = instance[prop];

        return index;
    }

    */

    count() {
        return this.filter((inst) => inst !== null).length;
    }

    subset(data = [], options = {}) {
        const Collection = this.constructor;
        return new Collection(data).of(this.Model, options);
    }

    pluck(prop) {
        const plucked = [];
        for (let i = 0; i < this.length; i++) {
            plucked.push(this[i][prop]);
        }
        return plucked;
    }

    removeAtIndex(index, ...replace) {
        this.splice(index, 1, ...replace);
    }

    replace(olditem, newitem) {
        const index = this.indexOfItem(olditem);
        this[index].fill(newitem);
    }

    sort(sorter = this.defaultSort) {
        const sort = super.sort(sorter);
        return sort;
    }

    findBy(key, value, exclude, all = false) {
        const indexes = this.findIndexBy(key, value, all, exclude);
        if (indexes === null) return null;
        return this.extract(indexes);
    }

    findIndexBy(key, value, all = false, exclude) {
        if (!Util.type(key, "array")) key = [key];
        if (!Util.type(value, "array")) value = [value];
        if (exclude !== undefined && !Util.type(exclude, "array")) exclude = [exclude];
        const found = [];

        for (let i = 0; i < this.length; i++) {
            let match = true;
            const inst = this[i];
            if (!(inst instanceof this.Model)) continue;
            for (let k = 0; k < key.length; k++) {
                const _key = key[k];
                const _value = value[k];
                if (Util.type(_value, "function")) {
                    if (_value(inst[_key]) !== true) match = false;
                } else {
                    if (inst[_key] !== _value) match = false;
                }

                if (!match) break;
            }
            if (match && (!exclude || exclude.indexOf(i) === -1)) found.push(i);
            if (found.length && !all) break;
        }
        // app.log('FIND INDEXES BY', key, value,found );

        return all ? found : found.length ? found[0] : null;
    }

    extract(indexes) {
        let output = "array";
        if (!Util.type(indexes, "array")) {
            output = "singular";
            indexes = [indexes];
        }
        const results = [];
        for (let i = 0; i < indexes.length; i++) {
            if (this[indexes[i]]) results.push(this[indexes[i]]);
        }
        return output == "array" ? results : results[0];
    }

    getIndex(instance) {
        for (let i = 0; i < this.length; i++) {
            if (this[i] === instance) return i;
        }
        return null;
    }

    reset(records = []) {
        while (this.length > 0) this.shift();
        this.emit("reset");
        if (records.length) {
            this.push(...records);
        }
    }

    /*
    pushInstance(instance){
        const self = this;
        const { Model } = this;

        if(!Model.is(instance)){
            instance  = new Model( instance, { collection: this, parent: this.#parent } );
        }else{
            instance.collection = self;
        }

        this.#prepare(instance);

        super.push(instance);

        this.sort();

        if(this.ready) this.emit('change', instance, 'added' );

        return i;
    }
*/

    updateAt(index, data) {}

    update(data, silent = false, saved = false) {
        if (!data) return;
        app.log("UPDATE COLLECTION", data, saved, this.Model.primaryKey);
        const pk = this.Model.primaryKey;
        for (let i = 0; i < data.length; i++) {
            const current = this.findBy(pk, data[i][pk]);
            if (current && current.diff(data[i])) {
                current.fill(data[i]);
            } else if (!current) {
                this.push(data[i]);
            }
        }
    }
    /*
    
*/
    save() {
        if (this.Model.collectionPatch) {
            clearTimeout(this.saveTO);
            this.saveTO = setTimeout(() => this.makePutPatch(), 500);

            return new Promise((resolve, reject) => {
                this.once("saved", () => resolve());
            });
        }
    }

    each(fn) {
        for (let i = 0; i < this.length; i++) {
            const boundFn = fn.bind(this[i]);
            boundFn(this[i], this);
        }
    }

    toArray() {
        const arr = [];
        for (let i = 0; i < this.length; i++) {
            if (!this[i].deleted) arr.push(this[i].toJson());
        }
        return arr;
    }

    toJson() {
        const json = [];
        for (let i = 0; i < this.length; i++) {
            if (!this[i].deleted) json.push(this[i].toJson());
        }

        return json;
    }
    /*
    #createIndexes(){
        
        for( let prop in this.#indexes ){
            if(this.#indexes[prop].length) this.#indexes[prop] = [];
        }

        for(let i=0;i<this.length;i++){
            for( let prop in this.#indexes ){
                this.#indexes[prop][i] = this[i][prop];
            }
        }

    }


    */
}

function createModelCollection(Model, options = {}) {
    const modelName = Model.name;
    const collectionName = modelName + "Collection";

    return {
        [collectionName]: class extends CollectionArray {
            static Model = Model;
            static options = options;

            constructor(...items) {
                console.log(items);
                super(...items);
                return this.of(this.constructor.Model, this.constructor.options);
            }
        }
    }[collectionName];
}

//Collection of model classes created by the collection function
const SubCollections = {};

function getSubCollection(collectionName, model) {
    if (SubCollections[collectionName]) {
        //Model already added to SubCollections
        return SubCollections[collectionName];
    } else {
        //Create Model and add to SubCollections
        SubCollections[collectionName] = createModelCollection(model);
        return SubCollections[collectionName];
    }
}

/**
 * Collection provides a way to search arrays of Models and return specific items
 * @param {Array} data - Data to be inserted into collection
 * @param {Model} model - Model which wraps or is wrapped around data items
 * @param {Object} options - Optional parameters to customize collection behavior
 * @returns {Proxy} - A proxy object for the collection
 */
function createNegativeTest(test) {
    return (value) => value !== test;
}

export function Collection(data = [], model, options = {}) {
    const modelName = model.name;
    const collectionName = modelName + "Collection";
    const ModelCollection = getSubCollection(collectionName, model);
    let collection = new ModelCollection(...data);

    //console.log(collection);

    const collectionProxy = new Proxy(collection, {
        get(target, prop, receiver) {
            if (target[prop]) {
                return typeof target[prop] === "function" ? target[prop].bind(target) : target[prop];
            }

            const propStr = String(prop);
            if (propStr.startsWith("sortBy")) {
                const keys = unStudly(propStr).replace("sort_by_", "").split("_and_");
                return function sortBy() {
                    for (const key of keys) {
                        const order = key.includes("_asc") ? "asc" : "desc";
                        const actualKey = key.replace(/_asc|_desc/g, "");
                        collection.sort((a, b) =>
                            (order === "asc" ? a[actualKey] < b[actualKey] : a[actualKey] > b[actualKey]) ? 1 : -1
                        );
                    }
                };
            }

            if (propStr.startsWith("findBy") || propStr.startsWith("findAllBy")) {
                const all = propStr.startsWith("findAllBy");
                const keys = unStudly(propStr).replace("find_by_", "").replace("find_all_by_", "").split("_and_");
                const negative = keys.filter((key) => key.includes("_not"));

                return function (...values) {
                    if (negative.length) {
                        for (let i = 0; i < keys.length; i++) {
                            if (negative.includes(keys[i])) {
                                keys[i] = keys[i].replace("_not", "");
                                values[i] = createNegativeTest(values[i]);
                            }
                        }
                    }

                    const records = collection.findBy(keys, values, null, all);

                    return (all ? records !== null && records.length > 0 : records !== null)
                        ? records
                        : all
                        ? []
                        : null;
                };
            }

            return Reflect.get(...arguments);
        },
        set(target, prop, value) {
            if (target.hasOwnProperty(prop) && target[prop] !== value) {
                target[prop] = value;
                return true;
            }
            return false;
        },
        getOwnPropertyDescriptor(target, prop) {
            return { enumerable: !!target[prop], configurable: true, value: target[prop] };
        },
        apply: Function.prototype.apply,
        construct: Function.prototype.construct,
        ownKeys: Reflect.ownKeys,
        has: Reflect.has,
        deleteProperty(target, prop) {
            if (prop in target) {
                delete target[prop];
                return true;
            }
            return false;
        },
        isExtensible: Reflect.isExtensible
    });

    collection.proxy = collectionProxy;

    return collectionProxy;
}

export default Collection;