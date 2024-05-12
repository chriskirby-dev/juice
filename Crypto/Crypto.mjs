class Crypto {
    static getRandomValues(array) {
        for (var i = 0, len = array.length; i < len; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
        return array;
    }
}

export default Crypto;
