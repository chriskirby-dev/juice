/**
 * IfElsePromise extends Promise to provide conditional branching within promise chains.
 * Allows chaining .if(), .elseIf(), and .else() conditions similar to traditional control flow.
 * @module Promises/IfElse
 */

/**
 * IfElsePromise provides conditional branching for promise chains.
 * @class IfElsePromise
 * @extends Promise
 * @example
 * new IfElsePromise((resolve) => resolve(15))
 *     .if((x) => x < 10, (x) => `${x} is small`)
 *     .elseIf((x) => x < 20, (x) => `${x} is medium`)
 *     .else((x) => `${x} is large`)
 *     .then(console.log); // Output: "15 is medium"
 */
class IfElsePromise extends Promise {
    /**
     * Creates a new IfElsePromise.
     * @param {Function} executor - The promise executor function (resolve, reject) => {}
     */
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

    /**
     * Adds a conditional handler to the promise chain.
     * @param {Function|boolean} condition - A function that returns a boolean or a boolean value
     * @param {Function} handler - The handler to call if condition is true
     * @returns {IfElsePromise} Returns this for chaining
     */
    if(condition, handler) {
        this._conditions.push({ condition, handler });
        return this;
    }

    /**
     * Alias for .if() to provide elseIf syntax.
     * @param {Function|boolean} condition - A function that returns a boolean or a boolean value
     * @param {Function} handler - The handler to call if condition is true
     * @returns {IfElsePromise} Returns this for chaining
     */
    elseIf(condition, handler) {
        // just an alias for .if()
        return this.if(condition, handler);
    }

    /**
     * Sets the default handler when no conditions match.
     * @param {Function} handler - The handler to call if no conditions match
     * @returns {IfElsePromise} Returns this for chaining
     */
    else(handler) {
        this._elseHandler = handler;
        return this;
    }

    /**
     * Runs through all conditions and returns the result of the matching handler.
     * @param {*} value - The value to test against conditions
     * @returns {Promise<*>} The result from the matching handler
     */
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

    /**
     * Overrides Promise.then to integrate conditional branching.
     * @param {Function} onFulfilled - Success handler
     * @param {Function} onRejected - Error handler
     * @returns {Promise} A new promise
     */
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
