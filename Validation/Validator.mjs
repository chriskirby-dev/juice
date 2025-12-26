import Presets from "./Presets.mjs";
import ValidationRules from "./Rules.mjs";
import ValidationMessages from "./Messages.mjs";
import Emitter from "../Event/Emitter.mjs";
import { ValidationErrors } from "./Errors.mjs";
import { empty } from '../Util/Core.mjs';

/*
validateField is a class that can be used to validate a single field.
#rules is a ValidationRules object that contains all the rules for the field.
#errors is a ValidationErrors object that contains all the errors for the field.
*/

class ValidatorInstance extends Emitter {

    #rules;
    scope;
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

    onRuleErrorsChange(property, diff){
        if (!empty(diff.added)) {
            this.updateErrors(property, diff.added);
        }
        if (!empty(diff.removed)) {
            this.removeErrors(property, diff.removed);
        }
       // debug('VALIDATOR RULE CHANGE',property, diff, this.errorsOf(property));
    }

    // New methods to update errors list and delete its elements
    updateErrors( property, addedTypes  ) {
        this.#rules.errorsOf(property).filter((err) => addedTypes.includes(err.type)).forEach((err) => this.errors.set(property, err));
    }

    //Resolve all errors

    removeErrors(property, removed) {
        this.errors.resolve(property, removed);
    }

    // Add a new rule to a field
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