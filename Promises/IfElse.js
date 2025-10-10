class IfElsePromise extends Promise {
    constructor(executor) {
        let resolveRef, rejectRef;
        super((resolve, reject) => {
            resolveRef = resolve;
            rejectRef = reject;
            executor(resolve, reject);
        });

        this._conditions = [];
        this._elseHandler = null;

        this._resolveRef = resolveRef;
        this._rejectRef = rejectRef;
    }

    if(condition, handler) {
        this._conditions.push({ condition, handler });
        return this;
    }

    elseIf(condition, handler) {
        // just an alias for .if()
        return this.if(condition, handler);
    }

    else(handler) {
        this._elseHandler = handler;
        return this;
    }

    async run(value) {
        for (const { condition, handler } of this._conditions) {
            let result = typeof condition === "function" ? condition(value) : condition;
            if (await result) {
                return handler(value);
            }
        }
        if (this._elseHandler) {
            return this._elseHandler(value);
        }
    }

    then(onFulfilled, onRejected) {
        return super.then(async (value) => {
            let result = await this.run(value);
            return onFulfilled ? onFulfilled(result) : result;
        }, onRejected);
    }
}

export default IfElsePromise;

/**

new IfElsePromise((resolve) => resolve(15))
    .if((x) => x < 10, (x) => `${x} is small`)
    .elseIf((x) => x < 20, (x) => `${x} is medium`)
    .else((x) => `${x} is large`)
    .then(console.log);

// Output: "15 is medium"

new IfElsePromise((resolve) => resolve(7))
    .if((x) => x === 7, (x) => `Lucky ${x}`)
    .if((x) => x < 10, (x) => `${x} is small`)
    .else((x) => `${x} didn’t match`)
    .then(console.log);

// Output: "Lucky 7"

*/
