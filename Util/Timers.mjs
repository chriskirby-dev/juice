let delays = {};
export function globalDelay(ms, id = "default") {
    if (delays[id]) clearTimeout(delays[id]);
    return new Promise((resolve) => {
        delays[id] = setTimeout(resolve, ms);
    });
}

export function createDelay() {
    let delays = {};

    return function delay(ms, id = "default") {
        if (delays[id]) clearTimeout(delays[id]);
        return new Promise((resolve) => {
            delays[id] = setTimeout(resolve, ms);
        });
    };
}

export default (() => {
    let delays = {};

    return function delay(ms, id = "default") {
        if (delays[id]) clearTimeout(delays[id]);
        return new Promise((resolve) => {
            delays[id] = setTimeout(resolve, ms);
        });
    };
})();
