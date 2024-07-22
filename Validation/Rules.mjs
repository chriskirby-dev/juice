import Util from '../Util/Core.mjs';
import { default as RulePresets, ERROR_TYPES } from './Presets.mjs';
import { ValidationError } from './Errors.mjs';
import Messages from './Messages.mjs';
import Emitter from '../Event/Emitter.mjs';
import RuleParser from './Rules/Parser.mjs';
import RuleSet from './Rules/RuleSet.mjs'
import { empty } from '../Util/Core.mjs';

//ValidationRules stores a set of rules for a given scope
//The scope is the object that the rules are being applied to
//The scope is used to resolve the value of a field
//Also stores the errors for the scope
class ValidationRules extends Emitter {

    #ruleSets = {};
    errors = {};
    scope;

    constructor( rules={}, scope ){
        super();
        if(scope) this.scope = scope;
        for(let prop in rules ){
            this.add( prop, rules[prop] );
        }
    }

    //Check if there are any errors
    hasErrors(){
        return Object.keys( this.errors ).length;
    }
    //Check if a property has a rule set
    has(property){
        return this.#ruleSets[property] ? true : false;
    }

    get(property){
        return this.#ruleSets[property] || [];
    }

    errorsOf(property){
        return this.errors[property] || [];
    }

    //Check if a property has a given rule
    propertyHasRule(property, type){
        return this.#ruleSets[property] && this.#ruleSets[property].has(type);
    }

    //Add a new rule or Rule group to a property
    add( property, rules ){
        
        //If the property already has rules, then add to the existing rules
        //Otherwise create a new rule set
        const ruleSet = this.has(property) ? this.#ruleSets[property] : new RuleSet(property, this.scope );
        //Add the rules to the rule set
        if(empty(rules)) return;
        ruleSet.add(rules);
        //Add the rule set to the rule sets
       if(!this.#ruleSets[property]) this.#ruleSets[property] = ruleSet;
    }

    //Get the  types for a given property
    errorTypes(property){
        return ( this.errors[property] || [] ).map( rule => rule.type );
    }

    //Test a property value against all its rules
    test( property, value ){
        //console.log('TESTING PROPERTY', property, value, this.scope );
        const lastErrorTypes = this.errorTypes(property);
        let changes = { added: [], removed: [] };
        return new Promise( (resolve, reject) => {

            if( !this.has(property) ) return resolve(true);
            //console.log('lastErrorTypes', property, lastErrorTypes, this.#ruleSets[property]);
            //If the value is empty and the rule does not require it, then skip validation
            if( empty(value) ){
                if(!this.#ruleSets[property].has('required')){
                    //If the property is not required and value is empty then reset errors
                    this.errors[property] = [];
                    this.emit('change', property, { added: [], removed: lastErrorTypes } );
                    return resolve(true);
                }else{
                    const rule =  this.#ruleSets[property].getRule('required');
                    //debug(rule);
                    this.errors[property] = [rule.toError()];
                    changes = Util.Array.diff( lastErrorTypes, ['required'] );
                    this.emit('change', property, changes );
                    return resolve(false);
                }
            
            }


            //If value passes validation test
            return this.#ruleSets[property].test(value).then(( errors ) => {
                //Returns an array of errors if the property failed validation
                //Returns an empty array if the property passed validation
               // debug(errors, lastErrorTypes);
                if( empty(errors) ){
                    //Property Passed Validation
                    //console.log('PASS VALIDATION', property);
                    //Reset errors
                    this.errors[property] = [];
                    //Emit change event, if there were any errors before
                    if(!empty(lastErrorTypes)) {
                        changes.added = [];
                        changes.removed.push( ...lastErrorTypes );
                    }
                }else{
                    //Property Failed Validation
                    //console.log('FAIL VALIDATION', errors);
                    //Test difference between last errors and current errors
                    debug(lastErrorTypes, errors.map( e => e.type ));
                    changes = Util.Array.diff( lastErrorTypes, errors.map( e => e.type ) );
                    //Set current errors
                    this.errors[property] = errors;
                    //Emit change event with the difference either added or removed
                }
               // debug(changes);
                //if there were any changes, emit the change event
                if( !empty(changes.added.concat(changes.removed)) ) this.emit('change', property, changes );
                return resolve( empty(errors) );
            }).catch( reject );
        });
      
    }

    testAll( data ){
        this.errors = {};
        const tests = [];
        for( let prop in data ){
            tests.push( this.test( prop, data[prop] ) );
        }
        return Promise.all(tests).then( results => results.filter( result => !result ).length > 0 );
    }
    
}

export default ValidationRules;