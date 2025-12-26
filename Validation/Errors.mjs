/**
 * Validation error classes and error collection management.
 * Provides error tracking with event emission and DOM tag generation.
 * @module Validation/Errors
 */

import Emitter from "../Event/Emitter.mjs";

/**
 * Manages validation errors for multiple properties with event emission.
 * @class ValidationErrors
 * @extends Emitter
 * @param {Object} scope - Parent validator scope
 * @example
 * const errors = new ValidationErrors(validator);
 * errors.set('email', emailError);
 * console.log(errors.has('email')); // true
 */
export class ValidationErrors extends Emitter {
    /** @type {Object} Parent validator scope */
    scope;
    /** @type {Object<string, Array>} Errors grouped by property */
    properties = {};
    /** @type {boolean} Overall validation state */
    _valid = true;
    
    constructor( scope ){
        super();
        this.scope = scope;
    }

    /**
     * Adds an error for a property.
     * @param {string} property - Property name
     * @param {ValidationError} error - Error object to add
     * @fires ValidationErrors#error
     * @fires ValidationErrors#property:invalid
     * @fires ValidationErrors#invalid
     */
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

    /**
     * Resolves errors for a property by error type.
     * @param {string} property - Property name
     * @param {Array<string>} [errorTypes=[]] - Error types to resolve
     * @fires ValidationErrors#resolve
     * @fires ValidationErrors#property:valid
     * @fires ValidationErrors#valid
     */
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

    /**
     * Checks if property has validation errors.
     * @param {string} property - Property name
     * @param {string} [errorType] - Specific error type to check
     * @returns {boolean} True if property has errors
     */
    has( property, errorType ){

        if( !this.properties[property] || this.properties[property].length == 0 ) return false;

        if( errorType && !this.properties[property].find( err => err.type == errorType ) ) return false;

        return true;
    }

    /**
     * Gets all errors grouped by property.
     * @returns {Object<string, Array>} All errors
     */
    all() {
        return this.properties;
    }

    /**
     * Gets errors for a specific property.
     * @param {string} property - Property name
     * @returns {Array<ValidationError>} Array of errors
     */
    get(property) {
        return this.properties[property] || [];
    }

    /**
     * Alias for get().
     * @param {string} property - Property name
     * @returns {Array<ValidationError>} Array of errors
     */
    of(property){
        return this.get(property);
    }

    /**
     * Checks if there are no errors.
     * @type {boolean}
     */
    get empty() {
        return Object.keys(this.properties).filter(key => this.properties[key].length > 0).length == 0;
    }

    /**
     * Gets count of properties with errors.
     * @type {number}
     */
    get length() {
        return Object.keys(this.properties).filter(key => this.properties[key].length > 0).length;
    }
}


/**
 * Base validation error with DOM tag generation and resolution callbacks.
 * @class ValidationError
 * @extends Error
 * @param {Object} rule - Validation rule that failed
 * @param {*} target - Target being validated
 * @example
 * const error = new ValidationError(rule, target);
 * error.onResolved(() => console.log('Error fixed'));
 * error.resolve();
 */
export class ValidationError extends Error {
    /** @type {Array<Function>} Callbacks to execute when resolved */
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

    /**
     * Resolves the error, removing DOM tag and calling callbacks.
     */
    resolve(){
        if(this.etag.parentNode) this.etag.parentNode.removeChild(this.etag);
        for(var i=0;i<this.resolvedCallbacks.length;i++){
            this.resolvedCallbacks[i]();
        }
    }

    /**
     * Registers callback to execute when error is resolved.
     * @param {Function} fn - Callback function
     */
    onResolved(fn){
        this.resolvedCallbacks.push(fn);
    }
}

/**
 * Type validation error.
 * @class TypeValidationError
 * @extends TypeError
 */
export class TypeValidationError extends TypeError {
    constructor( rule ){
        super(``);
    }
}

/**
 * Invalid timestamp error.
 * @class InvalidTimestamp
 * @extends TypeError
 */
export class InvalidTimestamp extends TypeError {
    constructor( rule ){

    }
}

/**
 * Required value error.
 * @class ValueRequiredError
 * @extends Error
 */
export class ValueRequiredError extends Error {
    constructor( rule ){
    const message = `Property: ${rule.property} is a required property and no value is set.`;
    super(message);
    }
}


/**
 * Maximum length validation error.
 * @class MaxLengthError
 * @extends Error
 */
export class MaxLengthError extends Error {
    constructor( rule ){
        const message = `Property: ${rule.property} value '${rule.value}' exceeds the maximum allowed length of ${rule.args[0]}`;
        super(message);
        this.code = 'MAX_LENGTH';
        this.name = 'MaxLengthError';
    }
}

/**
 * Minimum length validation error.
 * @class MinLengthError
 * @extends Error
 */
export class MinLengthError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'MIN_LENGTH';
        this.name = 'MinLengthError';
    }
}

/**
 * Postal code validation error.
 * @class PostalValidationError
 * @extends Error
 */
export class PostalValidationError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'POASTAL';
        this.name = 'PostalValidation';
    }
}

/**
 * Address validation error.
 * @class AddressValidationError
 * @extends Error
 */
export class AddressValidationError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'MIN_LENGTH';
        this.name = 'MinLengthError';
    }
}

/**
 * Phone number validation error.
 * @class PhoneValidationError
 * @extends Error
 */
export class PhoneValidationError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'MIN_LENGTH';
        this.name = 'MinLengthError';
    }
}


/**
 * Email validation error.
 * @class EmailValidationError
 * @extends Error
 */
export class EmailValidationError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'MIN_LENGTH';
        this.name = 'MinLengthError';
    }
}


/**
 * Not equal validation error.
 * @class NotEqualError
 * @extends Error
 */
export class NotEqualError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'MIN_LENGTH';
        this.name = 'MinLengthError';
    }
}


/**
 * Value not in allowed set validation error.
 * @class InSetError
 * @extends Error
 */
export class InSetError extends Error {
    constructor( rule ){
    
        super( `Property: ${rule.property} value '${rule.value}' does not meet the minimum allowed length of ${rule.args[0]}`);
        this.code = 'MIN_LENGTH';
        this.name = 'MinLengthError';
    }
}