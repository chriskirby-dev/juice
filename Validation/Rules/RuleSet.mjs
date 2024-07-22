import Rule from "./Rule.mjs";
import RuleParser from "./Parser.mjs";
import Emitter from "../../Event/Emitter.mjs";
import { DistinctArray } from "../../Symbol/Array.mjs";
import { ValidationError } from '../Errors.mjs';

//RuleSet stores a collection of rules for a single property
//You can add rules to the set and test the rules against a value
//Does not store the value or errors only the rules 
//test: runs the rules against a value and returns only the errors
class RuleSet extends Emitter {

    rules = [];
    property;
    scope;

    constructor(property, scope) {
        super();
        //Add property name
        this.property = property;
        //Add scope if it exists
        if (scope) this.scope = scope;
    }

    get ruleTypes(){
        return this.rules.map( rule => rule.type );
    }

    getRule(ruleType){
        return this.rules.filter( rule => rule.type === ruleType )[0];
    }

    

    has(type) {
        return this.ruleTypes.includes(type);
    }

    add(rules) {
      //  console.log('Add Rules', rules);
        let added = [];
        if (rules instanceof Rule) {
            //Adding a single instance Rule
            //If the rule already exists, skip
            if(this.has(rules.type)) return false;
            //Add Property name to rule
            rules.property = this.property
            //Add scope to rule if it exists
            if (this.scope) rules.scope = this.scope;
            //Add to added array
            added.push(rules);
        } else {
            //Parse rules
            const _rules = RuleParser.parse(rules).filter(rule => !this.has(rule.type))
            const types = _rules.map(rule => rule.type);
            const parsedRules = _rules.map((rule) => {
                //Add Property name to rule
                rule.property = this.property;
                //Add scope to rule if it exists
                if (this.scope) rule.scope = this.scope;
                return rule;
            });
            //Add to added array
            added = added.concat(parsedRules);
        }
        //Add each added rule to the rules array and the valid array
        this.rules = this.rules.concat(added);
    }

    onlyTest( type, value ){
        const rule = this.rules.filter( rule => rule.type === type);
        if(rule.length) return rule[0].test(value);
        else
        return new Promise().resolve(true);
    }

    //Test all rules against value
    test(value) {
        //debug(this.rules);
        return Promise.all( this.rules.map( rule => rule.test(value) ) ).then((values) => {
            //Return only errors of type ValidationError
            return values.filter( value => value instanceof ValidationError );
        });
    }

}

export default RuleSet;