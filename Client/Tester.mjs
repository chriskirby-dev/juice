class Tester {
    static defined = {};

    static get versionSearchString(){
        return this.defined.versionSearchString;
    };

    static searchVersion(dataString){
        var index = dataString.indexOf(Tester.versionSearchString);
        if (index == -1) return;
        return dataString.substring(index+Tester.versionSearchString.length+1).split(' ').shift();
    };

    static testData( data ){
        for (var i=0;i<data.length;i++)	{
            var testType = null;
            var tester = ( data[i].string && data[i].string.toLowerCase() || data[i].prop || null );			
            if(tester){
                this.defined.versionSearchString = data[i].versionSearch || data[i].identity;
                if(typeof tester == 'string'){
                    if (tester.indexOf(data[i].subString) != -1) return data[i].identity;
                }else if (typeof tester == 'object' ){
                    return data[i].identity;
                }
            }
        }
    };
    
}

export default Tester;