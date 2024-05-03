class ArrayUtil {

    static diff( a, b ){
      return {
        added: b.filter( i => !a.includes(i) ),
        removed: a.filter( i => !b.includes(i) )
      }
    }

    static first(arr){
      return arr[0];
    }

    static last(arr){
      return arr[arr.length-1];
    }
    static intersect( arr1, arr2 ) {
		  return arr1.filter(value => -1 !== arr2.indexOf(value));
    };
    
    static distinct( arr1, arr2 ) {
		  return arr1.filter(value => -1 === arr2.indexOf(value));
    };

    static merge(a, b){
      const merged = a.slice(0);
      for( let i=0;i<b.length;i++){
        if( merged.indexOf(b[i]) === -1 ){
          merged.push(b[i]);
        }
      }
      return merged;
    }

    static equal( a, b ){
      a = a.slice().sort();
      b = b.slice().sort();
      if( a.length !== b.length ) return false;
      var i = a.length;
      while (i--) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }

    static contains( a, b ){
      let i = b.length;
      while (i--) {
        if (a.indexOf(b[i]) === -1 ) return false;
      }
      return true;
    }

    static indexesOf( value, arr ){
      const indexes = [], i = -1;
      for(i = 0; i < arr.length; i++){
        if (arr[i] === value)
          indexes.push(i);
      }
      return indexes;
    }

    static pluck( prop, arr ){
      return arr.map( (item) => item[prop] );
    }

    static hasFunction(arr){
      return arr.map(item => typeof item == 'function' ).filter( bool => bool == true ).length > 0;
    }
}

export default ArrayUtil;