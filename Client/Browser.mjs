import Tester from './Tester.mjs';

const BROWSER_TYPES = [
    { string: navigator.userAgent, subString: "chrome", identity: "Chrome" },
    { string: navigator.userAgent, subString: "omniweb", versionSearch: "OmniWeb/", identity: "OmniWeb" },
    { string: navigator.vendor, subString: "apple", identity: "Safari", versionSearch: "Version" },
    { prop: window.opera, identity: "opera", versionSearch: "Version" },
    { string: navigator.vendor, subString: "icab", identity: "iCab" },
    { string: navigator.vendor, subString: "kde", identity: "Konqueror" },
    { string: navigator.userAgent, subString: "firefox", identity: "Firefox" },
    { string: navigator.vendor, subString: "camino", identity: "Camino" },
    { string: navigator.userAgent, subString: "netscape", identity: "Netscape" },
    { string: navigator.userAgent, subString: "msie", identity: "Explorer", versionSearch: "MSIE" },
    { string: navigator.userAgent, subString: "gecko", identity: "Mozilla", versionSearch: "rv" },
    // for older Netscapes (4-)
    { string: navigator.userAgent, subString: "mozilla", identity: "Netscape", versionSearch: "Mozilla" }
];

var vendors = 'Webkit Moz O ms Khtml'.split(' ');	
const prefix = { js: null, css: null };

(function( pre ){
    var prop = 'BorderRadius';
    var tmp = document.createElement('div'),
    len = vendors.length;
    while(len--){
        if( vendors[len] + prop in tmp.style ){
            pre.js = vendors[len];
            pre.css = '-'+vendors[len].toLowerCase()+'-';
            break;
        }
    }
})( prefix );


function flashVersion(){
		
    var version = null;
    function parseVersion(d) {
        d = d.match(/[\d]+/g);
        d.length = 3;
        return d.join(".");
    };

    if (navigator.plugins && navigator.plugins.length) {
        var e = navigator.plugins["Shockwave Flash"];
        e && (a = !0, e.description && (version = parseVersion(e.description)));
        navigator.plugins["Shockwave Flash 2.0"] && (a = !0, version = "2.0.0.11");
    } else {
         if (navigator.mimeTypes && navigator.mimeTypes.length) {
            var f = navigator.mimeTypes["application/x-shockwave-flash"];
            (a = f && f.enabledPlugin) && (version = parseVersion(f.enabledPlugin.description));
        } else {
            try {
                var g = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7"),
                    a = !0, version = parseVersion(g.GetVariable("$version"));
            } catch (h) {
                try {
                    g = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6"), a = !0, version = "6.0.21";
                } catch (i) {
                    try {
                        g = new ActiveXObject("ShockwaveFlash.ShockwaveFlash"), a = !0,version = parseVersion(g.GetVariable("$version"));
                    } catch (j) {}
                }
            }
        }
    }
    
    return version;
};

class ClientBrowser {
    static defined = {};

    static get name(){ 
        return this.defined.name || ( this.defined.name = Tester.testData( BROWSER_TYPES ) || "unknown" ).toLowerCase();
    }
    static get version(){ 
        if( this.defined.version ) return this.defined.version;
        let major, full;
        const minor = Tester.searchVersion(navigator.userAgent) || Tester.searchVersion(navigator.appVersion) || "unknown"
        if( minor !== 'unknown' ){
            full = minor.split('.');
            major = parseFloat(minor);
        }
        this.defined.version = {
            minor: minor,
            major: major,
            full: full
        }
        return this.defined.version;
    }
    static get prefix(){
        return prefix;
    }
    static get flash(){
        return this.defined.flash || ( this.defined.flash = flashVersion() );
    }

    static supports( property ){
        var _ven = vendors;
        if(prefix.js) _ven = ['', prefix.js];
        for (var i = 0; i < _ven.length; i++) {
            var prop = _ven[i] + ( property.charAt(0).toUpperCase() + property.slice(1) );
            if (typeof document.body.style[prop] != "undefined") return prop;
        }
        return false;
    }

    static addClasses(){
        document.body.classList.add( prefix.css );
    }
}


function checkBody(){
    if( document.body ){
        ClientBrowser.addClasses();
        return;
    }
    setTimeout( checkBody, 10 );
}

checkBody();


export default ClientBrowser;