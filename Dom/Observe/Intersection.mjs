/**
 * IntersectionObserver wrapper for viewport intersection detection.
 * Simplifies creation and management of intersection observers.
 * @module Dom/Observe/Intersection
 */

import Util from '../Util/Core.mjs';
import ObserveTools from './Tools.mjs';

/* 
IntersectionObserver
    Options: {
        root: Default is viewport
        rootMargin: (top, right, bottom, left)
        threshold:
    } 
*/
class ObserveIntersection {

    static observers = [];

    static create( threshold, root, margin ){

        if( Util.type(margin, 'array') ){
            margin = margin.map((m) => `${m}px`).join(' ');
        }else if( Util.type(margin, 'number') ){
            margin = `${margin}px`;
        }

        const options = {};
        if( threshold !== undefined ) options.threshold = ObserveTools.threshold(threshold);
        if( root ) options.root = root;
        if( margin ) options.margin = margin;
        app.log(options);
        const observer = new IntersectionObserver( (e, o) => { app.log(e, o); }, options );

        this.observers.push(observer);
        return observer;
    }
}

export default ObserveIntersection;