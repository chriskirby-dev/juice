/**
 * Validation error messages and message templates.
 * Provides localized error messages for validation rules.
 * @module Validation/Messages
 */

import Util from '../Util/Core.mjs';
const ALIASES = {

};

const MESSAGES = {
    'min': "%s must be minimum of %s chars long",
    'max': "%s must be maximum of %s chars long",
    'length': "%s must be between %s and %s chars long",
    'int': "must be a integer",
    'email': "%s must be a valid Email.",
    'phone': "%s must be a valid Phone Number. | Invalid Phone Number.",
    'address': "%s must be a valid Street Address.",
    'postal': "%s must be a valid Postal Code.",
    'unique':  "%s must be unique this has been used already",
    'in': "%s must be one of the following: %a...",
    'required': "%s is a required field",
};

export default {
    addAlias: function( field, name ){
        ALIASES[field] = name;
    },
    add: function( type, msg ){
        MESSAGES[type] = msg;
    },
    has: function(type){
        return MESSAGES[type] ? true : false;
    },
    get: function( rule ){
        const property = rule.field || rule.property;
        const args = [rule.args];

        if( MESSAGES[rule.type] ){
            const args = [ ALIASES[property] ? ALIASES[property]: property, ...rule.args ];
            return Util.String.sprintx( MESSAGES[rule.type], [args, rule.args, [rule.value]], ['s', 'a', 'v'] );
        }
        if(property.includes('[')) property = property.replace(']', '').split('[').pop();
        return property +' '+ rule.type +' ' +rule.args.join(' ');
    }
};