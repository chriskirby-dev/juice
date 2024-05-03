import Util from './Core.mjs'

const operators = {
    '>': ( value, target ) => value > target,
    '<': ( value, target ) => value < target,
    '>=': ( value, target ) => value >= target,
    '<=': ( value, target ) => value <= target,
    '=': ( value, target ) => value == target,
    '!=': ( value, target ) => value != target,
    'NULL': ( value ) => value === null,
    'EMPTY': ( value ) => Util.empty( value ),
    'string': ( value ) => Util.type( value, 'string' ),
    'number': ( value ) => !isNaN( value ),
    'object': ( value ) => Util.type( value, 'object' ),
    'array': ( value ) => Util.type( value, 'array' ),
    'int': ( value ) => {
        if(Util.type( value, 'string' )) value = Number(value);
        if(!Util.type( value, 'number' )) return false;
        return Math.floor(value) == value;
    },
    'json': ( value ) => {
        if( Util.type( value, 'string' ) ){
            try {
                JSON.parse(value);
            } catch (e) {
                return false;
            }
        }else{
            return Util.type( value, 'object' ) || Util.type( value, 'array' );
        }
        return true;
    }
}

export default operators;
