import Selector from '../../../../juice/Style/Selector.mjs';

function createIndexes( tree, indexBy ){

    const indexes = {
        ids: [],
        classes: [],
        tags: [],
        attributes: [],
    };

    function add( selector ){

        if( selector.id ){
            indexes.ids.push( selector );
        }
        if( selector.class ){
            indexes.classes.push( selector );
        }
        if( selector.tag ){
            indexes.tags.push( selector );
        }
        if( selector.attributes ){
            indexes.attributes.push( selector );
        }
    }
}

function querySelect( query, root ){

}