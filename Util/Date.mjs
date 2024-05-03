

function type(o, is_type) {
    var t = Object.prototype.toString
        .call(o)
        .split(" ")
        .pop()
        .replace("]", "")
        .toLowerCase();
    return is_type ? is_type === t : t;
}

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

class DateUtil {

    static presets = {};

    static addPreset( name, format ){
        this.presets[name] = format;
    }

    static type( date ){

    }

    static diff(d1,d2){
        
    }

    static local( date ){
        app.log();
        if(typeof date == 'string'){
            if(date.includes('-')) date = date.replace(/-/g, '/');
            date = new Date(date);
        }

        return new Date( date.getTime() + ( this.tzOffset * 1000 ) );
    }

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


    static ms = {
        seconds: 1000,
        minutes: 1000 * 60,
        hours: 1000 * 60 * 60,
        days: 1000 * 60 * 60 * 24,
        months: 1000 * 60 * 60 * 24 * 30,
        years: 1000 * 60 * 60 * 24 * 365
    };

    static parse(date){

        if ( typeof date == "number" ){
            return new Date(date);
        }else if (typeof date == "string" ){
            return new Date( this.strToTime( date ) );
        }

        return date;
    }

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

    static ago(date) {
        if (empty(date)) return this.parseMS(null);
        let now = new Date();
        let ms = now.getTime() - date.getTime();
        return this.parseMS(ms);
    }

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

    static get timezone(){
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    static get tzOffset(){
        const date = new Date();
        return date.getTimezoneOffset();
    }
}



export default DateUtil;
