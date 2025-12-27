/**
 * Virtual DOM query utilities for Chrome DevTools Protocol.
 * Provides CSS selector-based querying of virtual DOM trees.
 * @module ChromeProtocol/VirtualDom/Query
 */

import Selector from '../../../../juice/Style/Selector.mjs';

/**
 * Creates indexes for virtual DOM tree for efficient querying.
 * @private
 */
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