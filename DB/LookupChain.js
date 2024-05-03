import Collection from "./Model/Collection.mjs";


class LookupChain {

    chain = {
        columns: ['*']
    };

    constructor( Model ){
        this.Model = Model;
    }

    select( columns ){
        this.chain.columns = columns;
        return this;
    }

    where( conditions ){
        this.chain.where = conditions;
        return this;
    }

    order( order ){
        this.chain.order = order;
        return this;
    }

    limit( limit ){
        this.chain.limit = limit;
        return this;
    }

    offset( offset ){
        this.chain.offset = offset;
        return this;
    }

    first(){
        const { Model } = this;
        const { columns=['*'], where={} } = this.chain;
        const first = Model.db.first( Model.tableName, columns.join(', '), where );
        return new Model(first);
    }

    all( _limit, _offset ){
        if(_limit) this.chain.limit = _limit;
        if(_offset) this.chain.offset = _offset;
        const { Model } = this;
        const { columns=['*'], conditions={}, order, limit, offset } = this.chain;
        const all = Model.db.all( Model.tableName, columns.join(', '), conditions, order, limit, offset );
        return Model.Collection(all);
    }
}

export default LookupChain;