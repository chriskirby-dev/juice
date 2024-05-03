
import { default as Util, type, empty } from '../../Util/Core.mjs';
import DistinctArray from '../../DataTypes/DistinctArray.mjs';
//import { PackageFile, FileCollection } from './PackageFile.mjs';
import Emitter from '../../Event/Emitter.mjs';

const studly = Util.String.studly;
const unStudly = Util.String.unStudly;

export class CollectionArray extends Array {

    Model;
    #indexes = {};
    primaryKey = 'id';
    #unique = new DistinctArray();
    #options = {};
    #parent = null;
    #changed = new DistinctArray();
    exceptions = [];
    silent = false;
    autoSave = false;

    isCollection = true;

    static primaryKeys = ['id','uuid'];

    of( Model, options={} ){

        Emitter.bind(this);

        if( Model.collectionOptions ){
            options = Util.Object.merge( Model.collectionOptions, options );
        }

        this.Model = Model;
        this.#options = options;
        this.#changed = new DistinctArray();

        this.defaultSort = Model.collectionDefaultSort || function( a, b ){
            return 1;
        }
    
        if(this.length){
            //If collection contains items sorted according to the default sorting
            this.sort();
            for(let i=0;i<this.length;i++){
                this[i] = this.#prepare( this[i] );
                this.emit('insert', this[i], i );
            }
        }

        this.#initialize();

        this.ready = true;
        return this;
    }

    #prepare( record ){

        const { Model } = this;

        const instance = record instanceof Model ? record : new Model( record, { parent: this.#parent });
        instance.parent = this.#parent;
        instance.collection = this;    

        instance.on('change', (prop, value) => {
            this.#changed.push(instance);
            if(!this.silent) this.emit('change', instance, prop, value );
        });

        return instance;
    }
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

    */

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

    has( instance ){
        const primaryKey = instance[this.primaryKey];
        if(primaryKey === null) return -1;

        if( this.#indexes[this.primaryKey].indexOf(primaryKey) !== -1 ){}

    }


    #insert( instance, index=null ){

       if(index == null){
            //Get Insert Index
            index = this.getSortIndex(instance);
            //console.log('Sort Index', index);
       }

       const primaryKey = instance[this.primaryKey];

        let exists;
        if( !instance.exists || !this.#indexes[this.primaryKey] ){
            exists = -1;
        }else{
            exists = this.#indexes[this.primaryKey].indexOf(primaryKey);
        }

        app.log('INSERT INSTANCE', instance.toJson(), primaryKey, exists );

        if( exists !== -1 ){
            return this.#update(instance, exists );
        }
/*
        if( !this.#validate( instance ) ){
            //Fail Validation
            console.warn('EXCEPTION FOUND', this.exceptions );
            return false;
        }
*/
       // app.log('insert', index);
        //No index provided push to end
        instance.on('change', (prop, value) => {
            if(this.hasIndex(prop)){
                this.#indexes[prop][this.indexOfItem(instance)] = value;
            }
            this.#changed.push(instance);
            if(!this.silent) this.emit('change', instance, prop, value );
        });
        
        instance.on('saved', () => {
            const idx = this.#changed.findIndex( (inst) => inst === instance );
            this.#changed.splice(idx, 1);
        });

        instance.on('deleted', () => {
           // console.log('Collection Delete');
           
            this.delete(instance);
        });

        //Index Provided Shift all after forward and place
        if( Number.isInteger(index) ){
            this.shiftRight( 1, index );
            this[index] = instance;
        }
        if(this.ready) this.#changed.push(instance);
        //Set Indexes
        for( let prop in this.#indexes ) this.#indexes[prop][index] = instance[prop];

       // if(!this.silent) this.emit('change', instance, 'added' );
        if(!this.silent) this.emit('change', instance, 'insert' );
        //Emit instance inserted
        this.emit('insert', instance, index );

        return index;
    }

    #remove( instance ){
        if(!instance) return;
        if(!instance.deleted){
            instance.delete();
        }
        
        this.emit('change', instance, 'delete', instance.deleted );
        instance.removeListener('change', 'collectionChange' );
        const idx = this.getIndex(instance);
        /**************************************
         * REMOVE INSTANCE INDEX FROM INDEXES *
         **************************************/
        for( let prop in this.#indexes ) this.#indexes[prop].splice(idx, 1);
        //this[idx] = null;
       if(idx == this.length-1){
            this.pop();
        }else if(idx == 0){
            this.shift();
        }else{
            this.shiftLeft(1, idx+1);
        }

        this.emit('delete', instance, idx );
    }   

    count(){

        return this.filter( inst => inst !== null ).length;
    }

    delete( value ){
        console.log('delete', value );
        const instance = value instanceof this.Model ? value : this.findBy( this.Model.primaryKey, value[this.Model.primaryKey] );
        console.log(instance);
        this.remove(instance);
    }

    push( ...items ){
        const idxs = items.map( item => {
            return this.#insert(this.#prepare( item ));
        });
        return idxs.length == 1 ? idxs[0] : idxs;
    }

    pop(){
        return super.pop();
    }

    shift(){
        return super.shift();
    }

    unshift( ...items ){
        items = items.map( item => this.#prepare( item ) );
        return super.unshift( ...items );
    }



    shiftRight( increment, startAt=0, endAt ){
        if(!endAt) endAt = this.length-1;
        let i = endAt;
        while( i >= startAt ){
            this[i+increment] = this[i];
            i--;
        }
    }

    shiftLeft( increment, startAt=0, endAt ){
        if(!endAt) endAt = this.length-1;
        let i = startAt;
        while( i <= endAt ){
            if(i > endAt-increment){
                this.pop();
                i++;
                continue;
            }
            this[i-increment] = this[i];
            i++;
        }
    }

    subset(data=[]){
        const Collection = this.constructor;
        return new Collection( data ).of( this.Model );
    }

    setParent( parent ){
        this.#parent = parent;
    }

    getParent(){
        return this.#parent;
    }

    hasParent( parent ){
        return this.#parent ? true : false;
    }

    indexOfItem(item){
        for(let i=0;i<this.length;i++){
            if( this[i] === item ) return i;
        }
    }

    hasIndex(key){
        return this.#indexes[key] ? true : false;
    }

    searchIndex( key, value ){
        return this.#indexes[key].indexOf(value);
    }

    searchIndexAll( key, value ){
        return Util.Array.indexesOf( value, this.#indexes[key] );
    }

    removeAtIndex( index, ...replace ){
        this.splice( index, 1, ...replace );
    }

    replace( olditem, newitem ){
        const index = this.indexOfItem(olditem);
        this[index].fill(newitem)
    }

    remove( instance, ...replace ){
        app.log('Remove Instance');
        const index = this.indexOfItem(instance);
        this[index].deleted = Date.now();
        let i = index;
        for( let prop in this.#indexes ) this.#indexes[prop].splice(index, 1);

        while( i < this.length){
            this[i] = this[i+1];
            i++;
        }
        this.pop();
        this.emit('change', instance, 'deleted' );
          this.emit('change', instance, 'delete', instance.deleted );
        instance.removeListener('change', 'collectionChange' );
        /**************************************
         * REMOVE INSTANCE INDEX FROM INDEXES *
         **************************************/
        //this[idx] = null;
     
        this.emit('delete', instance, index );
    }

    sort( sorter=this.defaultSort ){

        const sort = super.sort( sorter );

    
        return sort;
    }

    getSortIndex( item, sorter=this.defaultSort ){
        let i = -1;
        let s = 1;
        while( i < this.length && s == 1 ){
            i++;
            s = sorter( item, this[i] );
        }
        return i;
    }


    findBy(key, value, exclude, all=false ){
        const indexes = this.findIndexBy( key, value, all, exclude );
        if(indexes === null) return null;
        return this.extract(indexes);
    }

    findIndexBy( key, value, all=false, exclude ){
        
        if( !Util.type( key, 'array' ) ) key = [key];
        if( !Util.type( value, 'array' ) ) value = [value];
        if( exclude !== undefined && !Util.type( exclude, 'array' ) ) exclude = [exclude];
        const found = [];

        for(let i=0;i<this.length;i++){
            let match = true;
            const inst = this[i];
            if(!(inst instanceof this.Model)) continue;
            for(let k=0;k<key.length;k++){
                const _key = key[k];
                const _value = value[k];
                if(Util.type( _value, 'function')){
                    
                    if( _value( inst[_key] ) !== true ) match = false;
                }else{
                    if( inst[_key] !== _value ) match = false;
                }

                if(!match) break;
            }
            if(match && (!exclude || exclude.indexOf(i) === -1)) found.push( i );
            if(found.length && !all) break;
        }
       // app.log('FIND INDEXES BY', key, value,found );
       
        return all ? found : ( found.length ? found[0] : null);
    }

    extract( indexes ){
        let output = 'array';
        if(!Util.type(indexes, 'array')){
            output = 'singular';
            indexes = [indexes];
        }
        const results = [];
        for(let i=0;i<indexes.length;i++){
            if(this[indexes[i]])
            results.push(this[indexes[i]]);
        }
        return output == 'array' ? results : results[0];
    }

    create( data={} ){
        const instance = this.#prepare( data );
        const idx = this.#insert(instance);
        console.log('create',idx);
        this.#changed.push( idx );
        return instance;
    }

    changed( reset ){
        const changed = this.extract(this.#changed);
        if( reset ) this.#changed.reset();
        return changed;
    }

    getIndex(instance){
        for(let i=0;i<this.length;i++){
            if(this[i] === instance) return i;
        }
        return null;
    }

    reset(records=[]){
        while(this.length > 0) this.shift();
        this.emit('reset');
        if(records.length) {
            this.push(...records);
        } 
    }

    pluck(prop){
        const plucked = [];
        for(let i=0;i<this.length;i++){
            plucked.push( this[i][prop] )
        }
        return plucked;
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
   

    updateAt( index, data ){

    }

    update( data, silent=false, saved = false ){
        if(!data) return;
        app.log('UPDATE COLLECTION', data, saved,this.Model.primaryKey  );
        const pk = this.Model.primaryKey;
        for( let i=0;i<data.length;i++ ){
            const current = this.findBy( pk, data[i][pk] );
            if(current && current.diff(data[i]) ){
                current.fill(data[i]);
            }else if(!current){
                this.push(data[i]);
            }
        }
    }

    makePutPatch(){
        const pk = this.Model.primaryKey;
        const patch = { insert: [], update: [], delete: [] };
        console.log('Make Patch', this.#changed);
        const inserts = [];
        const updates = [];
        this.#changed.slice(0).forEach( (inst) => {

            const changes = inst.getChanges();
            console.log('changes',changes);
            if(inst._delete){
                patch.delete.push( inst[this.Model.primaryKey] );
            }else if(!inst.exists){
                patch.insert.push( changes );
                inserts.push(inst);
            }else{
                patch.update.push( changes );
            }
        });
        console.log('patch',patch);

        if( ( patch.insert.length + patch.update.length + patch.delete.length ) > 0 ){
            this.Model.patch( patch ).then( (response) => {
                console.log(response);

                if(response.insert && response.insert.length ){
                    for( let i=0;i<inserts.length;i++ ){
                        inserts[i].afterSave(response.insert[i], 'created');
                        this.#changed.remove(inserts[i]);
                    } 
                }

                if(response.update && response.update.length ){
                    for( let i=0;i<response.update.length;i++ ){
                        const update = response.update[i];
                        const instance =  this.findBy(pk, update[pk] );
                        instance.afterSave(update, 'updated');
                        this.#changed.remove(instance);
                    }
                }

                if(response.delete && response.delete.length ){
                    for( let i=0;i<response.delete.length;i++ ){
                        const instance =  this.findBy(pk, esponse.delete[i] );
                        if(instance){
                            instance.delete();
                            this.#changed.remove(instance);
                        }
                    }
                }

                this.emit('saved');
            });
        }
        return patch;
    }

   save(){

        if(this.Model.collectionPatch){
            clearTimeout(this.saveTO);
            this.saveTO = setTimeout(() => this.makePutPatch(), 500 );

            return new Promise((resolve, reject) => {
                this.once('saved', () => resolve() );
            });
        }

   }

    each( fn ){
        
        for(let i=0;i<this.length;i++){
            const boundFn = fn.bind(this[i]);
            boundFn( this[i], this );
        }
    }

    toArray(){
        const arr = [];
        for(let i=0;i<this.length;i++){
            if(!this[i].deleted)
            arr.push(this[i].toJson());
        }
        return arr;
    }

    toJson(){
        const json = [];
        for(let i=0;i<this.length;i++){
            if(!this[i].deleted)
            json.push(this[i].toJson());
        }

        return json;
    }

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


    #initialize(){

        const { Model } = this;
        const { schema } = Model;
        const options = this.#options;

        if(!options.indexes) options.indexes = [];
    
        for( const key in schema ){
            if( schema[key].primaryKey ) this.primaryKey = key;
            if( schema[key].unique || schema[key].primaryKey ) this.#unique.push(key);
            if( schema[key].index || schema[key].primaryKey || schema[key].unique ) this.#indexes[key] = [];
        }

        if(!this.primaryKey) this.primaryKey = options.primaryKey || this.Model.primaryKey || null;
        this.#indexes[this.primaryKey] = [];


        this.sort();
    }

 }

 function createModelCollection( Model, options={} ){

    const modelName = Model.name;
    const collectionName = modelName + 'Collection';

    return { [collectionName]: class extends CollectionArray {

            static Model = Model;
            static options = options;

            constructor( ...items ){
                super( ...items );
                return this.of( this.constructor.Model, this.constructor.options );
                
            }

        }

    }[collectionName];
 }

 const SubCollections = {};

/**
 * @constructor Collection provides a way to search arrays of Models and return specific items
 * @param {*} data 
 * @param {*} model 
 * @param {*} options 
 * @returns 
 */
export function Collection( data, model, options={} ) {

    const modelName = model.name;
    const collectionName = modelName + 'Collection';
    let ModelCollection;


    if(SubCollections[collectionName] ){
        //Model already added to SubCollections
        ModelCollection = SubCollections[collectionName];
    }else{
        //Create Model and add to SubCollections
        ModelCollection = createModelCollection( model );
        SubCollections[collectionName] = ModelCollection;
    }

    //Instantinate Model to instance
    const collection = new ModelCollection( ...data );

    function createNegativeTest( test ){
        return function( value ){
            return value !== test;
        }
    }

    //Create Collection Proxy to use magic methods like findBy* sortBy*
    const collectionProxy =  new Proxy( collection, {

        get( target, prop, receiver ){

            /*
            if( target.hasOwnProperty(prop) ){
                app.log('Target has Property', prop, Util.type(target[prop]));
                app.log(target, prop, reciever);
                return Reflect.get(target, prop, target);
            }*/

            if( target[prop] ){
                //app.log(`Target has target[${prop}]`);
                let value = Reflect.get(target, prop, receiver);
                return typeof value == 'function' ? value.bind(target) : value;
            }

            

            if(type(prop, 'string')){

                if( prop.indexOf('sortBy') === 0 ){
                    //If prop starts with sortBy
                    
                    const keys = unStudly( prop ).replace('sort_by_', '').split('_and_');
                    return function sortBy(){

                        for(let i=0;i<keys.length;i++){
                            let key = keys[i];
                            let order = 'asc';
                            if(key.includes('_asc')){
                                key = key.replace('_asc', '');
                                order = 'asc';
                            }
                            if(key.includes('_desc')){
                                key = key.replace('_desc', '');
                                order = 'desc';
                            }
                         

                            collection.sort(function( a, b ){
                                if(order == 'asc')
                                return a[key] < b[key] ? 1 : -1;
                                else 
                                return a[key] > b[key] ? 1 : -1;
                            } );
                        }
                    }
                }

                if( prop.indexOf('findBy') === 0 || prop.indexOf('findAllBy') === 0){
                    let all = false;
                    const keys = unStudly( prop ).replace('find_by_', '').replace('find_all_by_', '').split('_and_');
                    const negitive = keys.filter( key => key.includes('_not') );

                    if(prop.indexOf('findAllBy') === 0) all = true;

                    return function( ...values ){

                        if(negitive.length){
                            for(let i=0;i<keys.length;i++){
                                if( negitive.includes(keys[i]) ){
                                    keys[i] = keys[i].replace('_not', '');
                                    values[i] = createNegativeTest(values[i]);
                                }
                            }
                        }

                        const records = collection.findBy(keys, values, null, all);

                        if(all){
                            if( records !== null && records.length > 0 ) return records;
                        }else if(records !== null){
                            if( records !== null ) return records;
                        }

                        return all ? [] : null;

                    }
                }

            


            }

            return Reflect.get(...arguments);

        },
        set( target, prop, value ) {
    
            if( !target.hasOwnProperty(prop) ){
                return false;
            }
    
            if( target[prop] !== value ){
                target[prop] = value;
            }
    
            return true;
        },
        getOwnPropertyDescriptor: function(target, prop) {
            return { enumerable: target[prop] ? true : false, configurable: true, value: target[prop] };
        },
        apply: function(target, thisArg, argumentsList){

        },
        construct: function(target, argumentsList, newTarget) {

        },
        ownKeys: function(target) {
            return Array.keys(target);
        },
        has: function(target, key) {
            return Array.keys(target).indexOf(key) !== -1;
        },
        deleteProperty: function( target, prop ) {
            if( prop in target ){
                delete target[prop];
                return true;
            }else{
                return false;
            }
        },
        isExtensible: function(target) {
            return true;
        }
    });

    collection.proxy = collectionProxy;

    return collectionProxy;
}


export default Collection;