/**
 * Validation module providing field validation with rules and error management.
 * Supports various validation rules with event-based error tracking and resolution.
 * @module Validation/Validator
 */

import Presets from "./Presets.mjs";
import ValidationRules from "./Rules.mjs";
import ValidationMessages from "./Messages.mjs";
import Emitter from "../Event/Emitter.mjs";
import { ValidationErrors } from "./Errors.mjs";
import { empty } from '../Util/Core.mjs';

/**
 * Validator instance managing validation rules and errors for fields.
 * Emits events for validation state changes and error updates.
 * @class ValidatorInstance
 * @extends Emitter
 * @param {Object|Array} rules - Validation rules configuration
 * @param {Object} [scope] - Scope object for validation context
 * @fires ValidatorInstance#error When validation error occurs
 * @fires ValidatorInstance#resolve When error is resolved
 * @fires ValidatorInstance#invalid When field becomes invalid
 * @fires ValidatorInstance#valid When all fields become valid
 * @fires ValidatorInstance#property:invalid When specific property becomes invalid
 * @fires ValidatorInstance#property:valid When specific property becomes valid
 * @example
 * const validator = new ValidatorInstance({
 *   email: 'required|email',
 *   age: 'required|min:18'
 * });
 * validator.on('error', (property, error) => {
 *   console.log(`${property}: ${error.message}`);
 * });
 */
class ValidatorInstance extends Emitter {
    /** @type {ValidationRules} Private validation rules instance */
    #rules;
    /** @type {Object} Validation scope */
    scope;
    /** @type {ValidationErrors} Private errors collection */
    #errors;

    constructor(rules, scope) {
        super();
        const self = this;
        this.#rules = new ValidationRules(rules, scope || this);
        if (scope) {
            this.scope = scope;
        }

        this.#errors = new ValidationErrors(this);
        //Listen for changes in rules and update errors list
        this.onRuleErrorsChange = this.onRuleErrorsChange.bind(this);
        this.#rules.on("change", this.onRuleErrorsChange );
    }

    /**
     * Handles rule error changes from ValidationRules.
     * @param {string} property - Property name
     * @param {Object} diff - Changes with added and removed errors
     * @private
     */
    onRuleErrorsChange(property, diff){
        if (!empty(diff.added)) {
            this.updateErrors(property, diff.added);
        }
        if (!empty(diff.removed)) {
            this.removeErrors(property, diff.removed);
        }
       // debug('VALIDATOR RULE CHANGE',property, diff, this.errorsOf(property));
    }

    /**
     * Updates errors list with newly added error types.
     * @param {string} property - Property name
     * @param {Array<string>} addedTypes - Array of added error types
     * @private
     */
    updateErrors( property, addedTypes  ) {
        this.#rules.errorsOf(property).filter((err) => addedTypes.includes(err.type)).forEach((err) => this.errors.set(property, err));
    }

    /**
     * Removes resolved errors from property.
     * @param {string} property - Property name
     * @param {Array<string>} removed - Array of removed error types
     * @private
     */
    removeErrors(property, removed) {
        this.errors.resolve(property, removed);
    }

    /**
     * Adds validation rule(s) to a property.
     * @param {string} property - Property name
     * @param {string} [rules=''] - Rule string (e.g., 'required|email')
     */
    addRule(property, rules = "") {
        this.#rules.add(property, rules);
    }

    //Check if a field has a given rule
    hasRule(property, rule) {
        return this.#rules.propertyHasRule(property, rule);
    }

    // Get all errors
    get errors(){
        return this.#errors;
    }

    set errors(v){
        return false;
    }

    // Get all errors for a given field

    errorsOf(property) {
        return this.errors.get(property) || [];
    }

    // Get all error messages for a given field

    messages(field) {
        let messages;
       // console.log(this.errors);
        if (field) {
            if (this.errors.has(field)) {
               // console.log(this.#errors.get(field));
                messages = this.errors.get(field).map((err) => err.message);
            }
        } else {
            messages = {};
            for (let field in this.errors) {
                messages[field] = this.errors.get(field).map((err) => err.message);
            }
        }
        return messages;
    }

    //Run validation on a single field

    async validateField(field, value) {
        return await this.#rules.test(field, value);
    }

    //Run validation on a single field

    async test(field, value) {
        return this.validateField(field, value);
    }

    //Run validation on a single field

    async validate(data) {
        return await this.#rules.testAll(data);
    }
}

class Validator {
    static make(rules, data, scope) {
        const validator = new ValidatorInstance(rules, scope);
        if (data) validator.validate(data);
        return validator;
    }

    static watchObject( target, rules, options={} ){
        const validator = new ValidatorInstance(rules, options.scope || target);
        validator.validate(target);
        return new Proxy( target, {
            get: function(target, property, receiver) {
                if(target == 'validator') return validator;
                return Reflect.get(...arguments);
            },
            set: function(target, property, value, receiver) {
                target[property] = value;
                const valid = validator.test(property, value);
                return true;
            }
        });
    }
}

export default Validator;