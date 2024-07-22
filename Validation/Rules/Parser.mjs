import Util from '../../Util/Core.mjs';
import Rule from './Rule.mjs';

//RuleParser is a static class that parses a string or array of rules into an array of Rule objects
class RuleParser {

    static parseArgs(args){
        if( Util.type( args, 'string' ) ){
            args = args.includes(',') ? args.split(',') : [args]
        }
        return ( args ? args : [] );
    }

    static parseString(raw){
        let rules = raw.includes('|') ? raw.split('|') : [raw];
        for(let r=0;r<rules.length;r++){
            let rule;
            if( rules[r].includes(':') ){
                let [type, args] = rules[r].split(':');
                rule = new Rule( type, ...RuleParser.parseArgs(args) );
            }else{
                rule = new Rule( rules[r] );
            }
            rules[r] = rule;
        }
        return rules;
    }

    /**
     * @example
     * ['empty', 'max:4', ['equals', 'eq'], ['min', 2]]
     * ['empty|max:4', ['min', 2]]
     * @param raw 
     */

    static parse(raw){
        let rules = [];
        if( Util.type( raw, 'string' ) ){
            rules = RuleParser.parseString(raw);
        }else if(Util.type( raw, 'array' )){
            //Raw is Array
            for(let r=0;r<raw.length;r++){
                if( Util.type( raw[r], 'string' ) ){
                    rules = rules.concat( RuleParser.parse(raw[r]) );
                }else if( raw[r] instanceof Rule ){
                    rules.push(raw[r]);
                }else if( Util.type( raw[r], 'array' ) ){
                    if(Util.Array.hasFunction(raw[r])){
                        const rule = new Rule( raw[r][0], ...RuleParser.parseArgs( raw[r][1] ) );
                        if( raw[r].length > 2 ) rule.fn = raw[r][2];
                        rules.push(rule);
                    }else{
                        const rules2 = this.parse(raw[r]);
                        rules = rules.concat(rules2);
                    }
                   
                    
                }
            }
        }

        return rules;
    }

}

export default RuleParser;