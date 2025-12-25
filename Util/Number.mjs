/**
 * Number utility module providing number manipulation and validation functions.
 * Includes methods for unit conversion, precision handling, and number type checking.
 * @module Number
 */

/**
 * NumberUtil class provides static utility methods for working with numbers.
 * Supports CSS unit handling, precision operations, and number validation.
 * @class NumberUtil
 * @example
 * NumberUtil.isNum("123") // returns true
 * NumberUtil.unitize("10px") // returns ["10", "px"]
 */
class NumberUtil {

    /** @type {Array<string>} Absolute CSS length units */
    static absUnits = ['cm', 'mm', 'Q', 'in', 'pc', 'pt', 'px'];

    /** @type {Array<string>} Relative CSS length units */
    static relUnits = ['%','em', 'ex', 'ch', 'rem', 'lh', 'rlh', 'vw', 'vh', 'vmin', 'vmax', 'vb', 'vi', 'svw', 'svh', 'lvw', 'lvh', 'dvw', 'dvh'];

    /**
     * Checks if a value is a valid number.
     * Converts strings to numbers before checking.
     * @param {number|string} n - The value to check
     * @returns {boolean} True if the value is a valid number
     * @static
     * @example
     * NumberUtil.isNum(123) // returns true
     * NumberUtil.isNum("123") // returns true
     * NumberUtil.isNum("abc") // returns false
     */
    static isNum(n){
        if( typeof n == 'string' ) n = Number(n);
        return !isNaN( n )
    }

    /**
     * Checks if a number is an integer.
     * @param {number} n - The number to check
     * @returns {boolean} True if the number is an integer
     * @static
     * @example
     * NumberUtil.isInt(5) // returns true
     * NumberUtil.isInt(5.5) // returns false
     */
    static isInt( n ){
        return Math.floor( n ) == n;
    }

    /**
     * Checks if a number is a float (has decimal places).
     * @param {number} n - The number to check
     * @returns {boolean} True if the number is a float
     * @static
     * @example
     * NumberUtil.isFloat(5.5) // returns true
     * NumberUtil.isFloat(5) // returns false
     */
    static isFloat( n ){
        return Math.floor( n ) !== n;
    }

    /**
     * Parses a number with unit into separate value and unit components.
     * Extracts numeric value and CSS unit from a string.
     * @param {number|string} n - The value to parse (e.g., "10px", "50%", 10)
     * @param {string} [unit='px'] - Default unit if none is found
     * @returns {Array<string>} Array with [value, unit]
     * @static
     * @example
     * NumberUtil.unitize("10px") // returns ["10", "px"]
     * NumberUtil.unitize("50%") // returns ["50", "%"]
     * NumberUtil.unitize(10) // returns [10, "px"]
     */
    static unitize( n, unit='px' ){
        const matched = `${n}`.match(/(\d+\.?\d*)([a-z%]{0,4})/i);
        if(matched){
            return [matched[1], matched[2] || unit ];
        }
        return [n, unit];
    }


    /**
     * Gets the number of decimal places in a float.
     * Returns 0 for integers.
     * @param {number} n - The number to check
     * @returns {number} The number of decimal places
     * @static
     * @example
     * NumberUtil.getPrecision(5.123) // returns 3
     * NumberUtil.getPrecision(5) // returns 0
     */
    static getPrecision( n ){
        if( this.isFloat( n ) ){
            const decimal = `${n}`.split('.')[1];
            return decimal.length;
        
        }
        return 0;
    }

    /**
     * Rounds a number to a specified precision (number of decimal places).
     * @param {number} number - The number to round
     * @param {number} precision - The number of decimal places
     * @returns {number} The rounded number
     * @static
     * @example
     * NumberUtil.precisionRound(5.6789, 2) // returns 5.68
     * NumberUtil.precisionRound(5.6789, 0) // returns 6
     */
    static precisionRound(number, precision) {
        var factor = Math.pow(10, precision);
        var n = precision < 0 ? number : 0.01 / factor + number;
        return Math.round( n * factor) / factor;
    }

    /**
     * Rounds a value down to the nearest multiple of a step value.
     * Useful for snapping values to grid or increment values.
     * @param {number} value - The value to step
     * @param {number} stepValue - The step increment
     * @returns {number} The stepped value
     * @static
     * @example
     * NumberUtil.step(23, 5) // returns 20
     * NumberUtil.step(27, 10) // returns 20
     */
    static step( value, stepValue ){
        
        return Math.floor( value/stepValue ) * stepValue;
    }

}

export default NumberUtil;