import Emitter from "../Event/Emitter.mjs";


export class ValidationErrors extends Emitter {

    scope;
    properties = {};

    _valid = true;
    constructor( scope ){
        super();
        this.scope = scope;
    }

    set( property, error ) {
        //console.warn( 'SET ERROR', property, error );

        const newState = !this.has(property);
        if ( newState ) this.properties[property] = [];
       
        this.scope.emit('error', property, error );
        if(newState){
            this.scope.emit('property:invalid', property );
            if(this._valid){
                delete this._valid;
                this.scope.emit('invalid', property );
            }
        }
        if( this.get(property) && this.get(property).find( err => err.type == error.type ) ) return;
        this.properties[property].push( error );
        
    }

    resolve( property, errorTypes=[] ){
        console.log('RESOLVE',property, errorTypes, this.properties[property], this.scope );
        this.get(property).filter( err => errorTypes.includes( err.type )).map( err => err.resolve() );

        this.properties[property] = this.get(property).filter( err => !errorTypes.includes( err.type ) );
        this.scope.emit('resolve', property, errorTypes );
        debug(this.get(property));
        if(!this.has(property)){
            debug('! Has Property');
            delete this.properties[property];
            this.scope.emit('property:valid', property );
            debug('property valid');
        }

        if(this.length == 0){
            this._valid = true;
            this.scope.emit('valid', property );
        }
    }

    has( property, errorType ){

        if( !this.properties[property] || this.properties[property].length == 0 ) return false;

        if( errorType && !this.properties[property].find( err => err.type == errorType ) ) return false;

        return true;
    }

    all() {
        return this.properties;
    }

    get(property) {
        return this.properties[property] || [];
    }

    of(property){
        return this.get(property);
    }

    get empty() {
        return Object.keys(this.properties).filter(key => this.properties[key].length > 0).length == 0;
    }

    get length() {
        return Object.keys(this.properties).filter(key => this.properties[key].length > 0).length;
    }
}


export class ValidationError extends Error {

    resolvedCallbacks = [];

    constructor( rule, target ){
       
        super(`ValidationError: ${rule.property} ${rule.message()}`);
        this.name = this.constructor.name;
        this.type = rule.type;
        this.args = rule.args;
        this.property = rule.property;
        this.scope = rule.scope;
        this.value = rule.value;
        this.rule = rule;
        this.message = rule.message();

        const tag = document.createElement('div');
        tag.className = 'e-tag';
        tag.setAttribute('data-type', rule.type);
        tag.setAttribute('data-property', rule.property);
        tag.setAttribute('data-value', rule.value);
        let text = rule.type;
        switch(rule.type){
            case 'min':
            case 'max':
            text += `: ${rule.args[0]}`;
            break;
            case 'length':
            text += `: ${rule.args[0]} - ${rule.args[1]}`;
            break;
        }
        tag.innerHTML = text;
        this.etag = tag;
        
 
    }

    resolve(){
        if(this.etag.parentNode) this.etag.parentNode.removeChild(this.etag);
        for(var i=0;i<this.resolvedCallbacks.length;i++){
            this.resolvedCallbacks[i]();
        }
    }

    onResolved(fn){
        this.resolvedCallbacks.push(fn);
    }
}

export class TypeValidationError extends TypeError {
    constructor( rule ){
        super(``);
    }
}

export class InvalidTimestamp extends TypeError {
    constructor( rule ){

    }
}

export class ValueRequiredError extends Error {
    constructor( rule ){
    const message = `Property: ${rule.property} is a required property and no value is set.`;
    super(message);
    }
}


export class MaxLengthError extends Error {
    constructor( rule ){
        const message = `Property: ${rule.property} value '${rule.value}' exceeds the maximum allowed length of ${rule.args[0]}`;
        super(message);
        this.code = 'MAX_LENGTH';
        this.name = 'MaxLengthError';
    }
}

export class MinLengthError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'MIN_LENGTH';
        this.name = 'MinLengthError';
    }
}

export class PostalValidationError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'POASTAL';
        this.name = 'PostalValidation';
    }
}

export class AddressValidationError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'MIN_LENGTH';
        this.name = 'MinLengthError';
    }
}

export class PhoneValidationError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'MIN_LENGTH';
        this.name = 'MinLengthError';
    }
}


export class EmailValidationError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'MIN_LENGTH';
        this.name = 'MinLengthError';
    }
}


export class NotEqualError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'MIN_LENGTH';
        this.name = 'MinLengthError';
    }
}


export class InSetError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'MIN_LENGTH';
        this.name = 'MinLengthError';
    }
}