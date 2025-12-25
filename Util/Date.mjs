/**
 * Date utility module providing date formatting, parsing, and manipulation functions.
 * Supports various date formats, timezone handling, and relative time calculations.
 * @module Date
 */

/**
 * Determines the type of a value.
 * @private
 * @param {*} o - The value to check
 * @param {string} [is_type] - Optional type to check against
 * @returns {string|boolean} The type name or boolean if checking
 */
function type(o, is_type) {
    var t = Object.prototype.toString
        .call(o)
        .split(" ")
        .pop()
        .replace("]", "")
        .toLowerCase();
    return is_type ? is_type === t : t;
}

/**
 * Checks if a value is empty.
 * @private
 * @param {*} val - The value to check
 * @returns {boolean} True if the value is empty
 */
function empty(val) {
    var empty;
    if (val === undefined || val === null) return true;

    switch (type(val)) {
        case "string":
            empty = val.trim().length == 0;
            break;
        case "array":
            empty = val.length == 0;
            break;
        case "object":
            empty = Object.keys(val).length == 0;
            break;
        case "date":
            break;
    }
    return empty;
}

/**
 * DateUtil class provides comprehensive date manipulation and formatting utilities.
 * Includes date parsing, formatting with custom patterns, timezone handling, and relative time calculations.
 * @class DateUtil
 * @example
 * DateUtil.format(new Date(), "Y-m-d H:i:s") // returns "2024-12-25 10:30:00"
 * DateUtil.ago(new Date(Date.now() - 3600000)) // returns {hours: 1, ...}
 */
class DateUtil {

    /** @type {Object} Preset date format patterns */
    static presets = {};

    /**
     * Adds a named preset date format.
     * @param {string} name - The preset name
     * @param {string} format - The format string
     * @static
     */
    static addPreset( name, format ){
        this.presets[name] = format;
    }

    /**
     * Returns the type of a date value.
     * @param {Date} date - The date to check
     * @returns {string} The type of the date
     * @static
     */
    static type( date ){

    }

    /**
     * Calculates the difference between two dates.
     * @param {Date} d1 - The first date
     * @param {Date} d2 - The second date
     * @returns {number} The difference in milliseconds
     * @static
     */
    static diff(d1,d2){
        
    }

    /**
     * Converts a date to local timezone.
     * Adjusts date by timezone offset to get local time.
     * @param {Date|string} date - The date to convert
     * @returns {Date} The date adjusted to local timezone
     * @static
     */
    static local( date ){
        app.log();
        if(typeof date == 'string'){
            if(date.includes('-')) date = date.replace(/-/g, '/');
            date = new Date(date);
        }

        return new Date( date.getTime() + ( this.tzOffset * 1000 ) );
    }

    /**
     * Converts a string representation to timestamp.
     * Supports special strings like "today", "now", and ISO date strings.
     * @param {string} str - The string to convert
     * @returns {number|string} The timestamp or formatted date string
     * @static
     * @example
     * DateUtil.strToTime("today") // returns timestamp for start of today
     * DateUtil.strToTime("now") // returns current timestamp
     */
    static strToTime( str ){
        const d = new Date();
        switch( str ){
            case 'today':
                d.setHours(0, 0, 0, 0);
                return d.getTime();
            break;
            case 'now':
                return Date.now();
            break;
            default:
            if(str.includes('T'))
                return str.replace(/.[0]+Z/g, '').replace('T', ' ');
            else
                return new Date.parse(str);
        }
    }


    /** @type {Object} Millisecond conversions for time units */
    static ms = {
        seconds: 1000,
        minutes: 1000 * 60,
        hours: 1000 * 60 * 60,
        days: 1000 * 60 * 60 * 24,
        months: 1000 * 60 * 60 * 24 * 30,
        years: 1000 * 60 * 60 * 24 * 365
    };

    /**
     * Parses various date formats into a Date object.
     * Accepts numbers (timestamps), strings, or Date objects.
     * @param {Date|string|number} date - The date to parse
     * @returns {Date} The parsed Date object
     * @static
     * @example
     * DateUtil.parse("2024-12-25") // returns Date object
     * DateUtil.parse(1640000000000) // returns Date object from timestamp
     */
    static parse(date){

        if ( typeof date == "number" ){
            return new Date(date);
        }else if (typeof date == "string" ){
            return new Date( this.strToTime( date ) );
        }

        return date;
    }

    /**
     * Parses milliseconds into time unit components (years, months, days, etc.).
     * Breaks down a duration in milliseconds into human-readable units.
     * @param {number|null} ms - The milliseconds to parse (null returns "?" for all units)
     * @returns {Object} Object with time unit counts (years, months, days, hours, minutes, seconds, ms)
     * @static
     * @example
     * DateUtil.parseMS(3661000) // returns {hours: 1, minutes: 1, seconds: 1, ms: 0}
     */
    static parseMS(ms) {
        let counts = {};
        let times = Object.keys(this.ms);

        if (ms === null) {
            while (times.length > 0) counts[times.pop()] = "?";
            return counts;
        }

        while (ms > this.ms.seconds && times.length > 0) {
            var scale = times.pop();
            counts[scale] =
                ms < this.ms[scale] ? 0 : Math.floor(ms / this.ms[scale]);
            ms -= counts[scale] * this.ms[scale];
        }
        counts.ms = ms;
        return counts;
    }

    /**
     * Formats a date according to a format string.
     * Supports PHP-like date format characters (Y, m, d, H, i, s, etc.).
     * @param {Date|string|number} date - The date to format
     * @param {string} format - The format string (e.g., "Y-m-d H:i:s")
     * @returns {string|null} The formatted date string, or null if date is empty
     * @static
     * @example
     * DateUtil.format(new Date(), "Y-m-d") // returns "2024-12-25"
     * DateUtil.format(new Date(), "F j, Y") // returns "December 25, 2024"
     * 
     * Format characters:
     * - Y: 4-digit year
     * - y: 2-digit year
     * - F: Full month name
     * - M: Short month name
     * - m: 2-digit month (01-12)
     * - n: Month without leading zero
     * - d: 2-digit day (01-31)
     * - j: Day without leading zero
     * - H: 2-digit hour (00-23)
     * - h: Hour (1-12)
     * - i: 2-digit minutes
     * - s: 2-digit seconds
     * - A: AM/PM
     */
    static format(date, format) {

        if (empty(date)) return null;
        let isString = false;
        if (typeof date == "string"){
            isString = true;
            if(date.includes('-')) date = date.replace(/-/g, '/');
            if(date.includes('000Z')) date = date.replace(/.[0]+Z/g, '').replace('T', ' ');
        }
        app.log(typeof date);
        app.log(date, this.timezone, this.tzOffset );

        if (typeof date == "string" || typeof date == "number")
            date = new Date(date);

            app.log(date);

        function twoDigit(num) {
            if (num < 10) return "0" + num;
            return num;
        }

        var months = {
            long: [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December"
            ],
            short: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sept",
                "Oct",
                "Nov",
                "Dec"
            ]
        };

        var weekdays = {
            long: [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wendsday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ],
            short: ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"]
        };
        app.log( date.getMonth(), date.getDate(), date.getFullYear() );

        var formatter = {
            d: function() {
                return twoDigit(date.getDate());
            },
            j: function() {
                return date.getDate();
            },
            Y: function() {
                return date.getFullYear();
            },
            y: function() {
                return twoDigit(date.getFullYear());
            },
            F: function() {
                return months.long[date.getMonth()];
            },
            m: function() {
                return twoDigit(date.getMonth() + 1);
            },
            M: function() {
                return months.short[date.getMonth()];
            },
            n: function() {
                return date.getMonth();
            },
            h: function() {
                let hours = date.getHours();
                if(hours > 12 ) hours = hours-12;
                return hours;
            },
            H: function() {
                return twoDigit(this.h());
            },
            i: function() {
                return twoDigit(date.getMinutes());
            },
            s: function() {
                return twoDigit(date.getSeconds());
            },
            A: function() {
                let hours = date.getHours();

                return hours >= 12 ? "PM" : "AM";
            }
        };
        var formatted = "";
        var parts = format.split("");
        for (var i = 0; i < parts.length; i++) {
            formatted += formatter[parts[i]] ? formatter[parts[i]]() : parts[i];
        }
        return formatted;
    }

    /**
     * Calculates how long ago a date was from now.
     * Returns time units breakdown (years, months, days, hours, minutes, seconds, ms).
     * @param {Date} date - The date to calculate from
     * @returns {Object} Object with time unit counts representing the elapsed time
     * @static
     * @example
     * DateUtil.ago(new Date(Date.now() - 3600000)) // returns {hours: 1, minutes: 0, ...}
     */
    static ago(date) {
        if (empty(date)) return this.parseMS(null);
        let now = new Date();
        let ms = now.getTime() - date.getTime();
        return this.parseMS(ms);
    }

    /**
     * Converts a time ago object to a human-readable string.
     * @param {Date} date - The date to calculate from
     * @param {number} [stop=4] - Maximum number of time units to include
     * @param {string} [stopStr=''] - Stop at this specific unit
     * @returns {string} Human-readable "time ago" string
     * @static
     * @example
     * DateUtil.agoString(new Date(Date.now() - 3661000), 2) // returns "1 hours 1 minutes ago"
     */
    static agoString( date, stop=4, stopStr='' ){
        if( ago < 1000 * 60) return 'Just Now';
        const ago = this.ago( date );
        let parts = [];
        let max_unit = null;
        for( let unit in ago ){
            if(ago[unit] > 0){
                parts.push( ago[unit] +' '+unit );
            }
            if(parts.length == stop || unit == stopStr) break;
        }
        return parts.join(' ') + ' ago';
    }

    /**
     * Gets the current timezone name.
     * @returns {string} The timezone name (e.g., "America/New_York")
     * @static
     */
    static get timezone(){
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /**
     * Gets the timezone offset in minutes from UTC.
     * @returns {number} The timezone offset in minutes
     * @static
     */
    static get tzOffset(){
        const date = new Date();
        return date.getTimezoneOffset();
    }
}



export default DateUtil;
