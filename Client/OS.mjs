
const PLATFORMS = {
    mac: { str: navigator.platform.toLowerCase(), terms: ['mac'] },
    win: { str: navigator.platform.toLowerCase(), terms: ['win'] },
    ios: { str: navigator.platform.toLowerCase(), terms: ['ipad','iphone','ipod'] },
    andriod: { str: navigator.userAgent.toLowerCase(), terms: ['android'] },
    iemoble: { str: navigator.userAgent.toLowerCase(), terms: ['iemobile'] }
};


var getPlatform = function(){
    let platform;
    for(let p in PLATFORMS){
        for(var i=0;i<PLATFORMS[p].terms.length;i++){
            if(PLATFORMS[p].str.indexOf(PLATFORMS[p].terms[i]) != -1) platform = p;
        }
    }
    return platform;
};

class OS {
    static defined = {};
    static get name(){
        return this.defined.name || ( this.defined.name = getPlatform() );
    }
}

export default OS;