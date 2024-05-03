
const vElement = ( tag, attrs, children, ns=null, options=null ) => {

    const vElem = Object.create(null);

    return Object.assign(vElem, {
      tag,
      attrs,
      children,
      ns,
      options
    });


}


export default vElement;