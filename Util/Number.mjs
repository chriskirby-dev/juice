class NumberUtil {

    static absUnits = ['cm', 'mm', 'Q', 'in', 'pc', 'pt', 'px'];

    static relUnits = ['%','em', 'ex', 'ch', 'rem', 'lh', 'rlh', 'vw', 'vh', 'vmin', 'vmax', 'vb', 'vi', 'svw', 'svh', 'lvw', 'lvh', 'dvw', 'dvh'];

    static isNum(n){
        if( typeof n == 'string' ) n = Number(n);
        return !isNaN( n )
    }

    static isInt( n ){
        return Math.floor( n ) == n;
    }

    static isFloat( n ){
        return Math.floor( n ) !== n;
    }

    static unitize( n, unit='px' ){
        const matched = `${n}`.match(/(\d+\.?\d*)([a-z%]{0,4})/i);
        if(matched){
            return [matched[1], matched[2] || unit ];
        }
        return [n, unit];
    }


    static getPrecision( n ){
        if( this.isFloat( n ) ){
            const decimal = `${n}`.split('.')[1];
            return decimal.length;
        
        }
        return 0;
    }

    static precisionRound(number, precision) {
        var factor = Math.pow(10, precision);
        var n = precision < 0 ? number : 0.01 / factor + number;
        return Math.round( n * factor) / factor;
    }

    static step( value, stepValue ){
        
        return Math.floor( value/stepValue ) * stepValue;
    }

}

export default NumberUtil;