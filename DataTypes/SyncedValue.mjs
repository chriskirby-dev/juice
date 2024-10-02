class SyncedValue {
    constructor(value) {
        this._value = value;
        this.synced = [];
    }

    get value() {
        return this._value;
    }

    set value(value) {
        if (value == this._value) return;
        this._value = value;
        this.synced.forEach(({ parent, property }) => {
            parent[property] = value;
        });
    }

    sync(parent, property) {
        parent[property] = this.value;
        this.synced.push({ parent, property });
    }

    unsync(parent, property) {
        parent[property] = this.value;
        const index = this.synced.indexOf({ parent, property });
        if (index === -1) return;
        this.synced.splice(index, 1);
    }
}

export default SyncedValue;
