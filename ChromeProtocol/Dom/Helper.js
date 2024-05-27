class DomHelper {
    static parseAttributeArray(attributeArray){
        return attributeArray.reduce((result, value, index, array) => {
            if (index % 2 === 0) {
                const property = value;
                const nextValue = array[index + 1];
                if (nextValue !== undefined) {
                    result[property] = nextValue;
                }
            }
            return result;
        }, {});
    }
}

export default DomHelper;