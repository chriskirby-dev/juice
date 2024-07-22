class HistoryValue {
    HISTORY_LENGTH = 0;
    #options = {};
    constructor(v, options = {}) {
        if (options.history) this.#options = options.history;
        if (options) this.HISTORY_LENGTH = options.history || 1;
        this._history = new Float32Array((options.props.length || 1) * this.HISTORY_LENGTH);
        if (v !== undefined && v !== null) this._value = v;
    }

    get history() {
        const options = this.options.history || {};
        return {
            get length() {
                return this._history.length;
            },
            get value() {
                return this._history;
            },
        };
    }

    getHistoricValue(i) {
        if (i === undefined) i = 0;
        return this.history[i];
    }

    setHistoricValue(v) {
        this.history.unshift(v);
        if (this.HISTORY_LENGTH) {
            if (this.history.length > this.HISTORY_LENGTH) this.history.pop();
        }
    }
}

export default HistoryValue;
