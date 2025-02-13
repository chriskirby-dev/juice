let delays = {};
export function globalDelay(ms, id = "default") {
    if (delays[id]) clearTimeout(delays[id]);
    return new Promise((resolve) => {
        delays[id] = setTimeout(resolve, ms);
    });
}

export default new Proxy(
    {},
    {
        get() {
            let delays = {};
            return function delay(ms, id = "default") {
                if (delays[id]) clearTimeout(delays[id]);
                return new Promise((resolve) => {
                    delays[id] = setTimeout(resolve, ms);
                });
            };
        },
    }
);
