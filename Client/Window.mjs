/**
 * Window utilities for managing browser window properties and events.
 * Provides getters/setters for dimensions, scroll position, and event handling.
 * @module Client/Window
 */

import EventEmitter from '../Event/Emitter.mjs'; 

import Ease from '../Animate/Ease.mjs';
import Coordinates from '../Math/Coordinates.mjs';

/**
 * Window management class with dimension and scroll utilities.
 * @class Window
 * @extends EventEmitter
 * @example
 * const win = new Window();
 * console.log(win.width, win.height);
 * win.scrollTop = 500;
 */
class Window extends EventEmitter{
    /** @type {boolean} Whether window is currently scrolling */
    scrolling = false;
    /** @type {number} Current Y scroll position */
    scrollY = 0;
    /** @type {number} Current X scroll position */
    scrollX = 0;

    constructor(){
        super();
        this.initialize();
    }

    /**
     * Gets window width.
     * @type {number}
     */
    get width(){
        return window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;
    }

    /**
     * Sets window width (resizes window).
     * @type {number}
     */
    set width( width ){
        window.resizeTo( width, this.height );
    }

    /**
     * Gets window height.
     * @type {number}
     */
    get height(){
        return window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;
    }

    /**
     * Sets window height (resizes window).
     * @type {number}
     */
    set height( height ){
        window.resizeTo( this.width, height );
    }

    /**
     * Gets vertical scroll position.
     * @type {number}
     */
    get scrollTop(){
        return document.body.scrollTop || document.documentElement.scrollTop;
    }

    /**
     * Sets vertical scroll position.
     * @type {number}
     */
    set scrollTop( px ){
        return window.scrollTo( this.scrollLeft, px );
    }

    /**
     * Gets maximum vertical scroll position.
     * @type {number}
     */
    get scrollTopMax(){
        return document.documentElement.scrollHeight - document.documentElement.clientHeight;
    }

    /**
     * Gets horizontal scroll position.
     * @type {number}
     */
    get scrollLeft(){
        return document.body.scrollLeft || document.documentElement.scrollLeft;
    }

    /**
     * Sets horizontal scroll position.
     * @type {number}
     */
    set scrollLeft( px ){
        return window.scrollTo( px, this.scrollTop );
    }

    /**
     * Gets maximum horizontal scroll position.
     * @type {number}
     */
    get scrollLeftMax(){
        return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    }

    scrollTo( x=0, y=0, duration ){
        const top = Math.min( this.scrollTopMax, y );
        const left = Math.min( this.scrollLeftMax, x );
        window.scrollTo( left, top );
      
    }

    scrollToElement( element ){
        const header = document.querySelector('body > header');
        const headerRect = header.getBoundingClientRect();
        const elRect = element.getBoundingClientRect();

    }

    onScrollStart(){

        const self = this;

        this.scrolling = true;

        this.scrollY = this.scrollTop;
        this.scrollX = this.scrollLeft;

        this.emit('scroll', this.scrollLeft, this.scrollTop );

        function scrollFire(){
            
            if( self.scrollY !== self.scrollTop || self.scrollX !== self.scrollLeft ){
                self.scrollY = self.scrollTop;
                self.scrollX = self.scrollLeft;
                self.emit('scroll', self.scrollX, self.scrollY );
            }
            if(self.scrolling) window.requestAnimationFrame( scrollFire );
        }

        window.requestAnimationFrame( scrollFire );
    }

    initialize(){

        const self = this;

        this.scrollY = window.scrollY;
        this.scrollX = window.scrollX;

        let scrollTO;

        document.addEventListener("scroll", () => {
            if(!this.scrolling){
                this.onScrollStart();
            }
            clearTimeout(scrollTO);
            scrollTO = setTimeout(() => {
                this.scrolling = false;
            }, 50 );
        });

        window.addEventListener("resize", () => {
            this.emit("resize", this.width, this.heihgt );
        });

        window.addEventListener( "orientationchange", () => {
            var orientation = window.orientation;
            this.emit( "orientationchange", window.orientation );
        });

        return false;
    }

}


export default new Window();