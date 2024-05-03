import EventEmitter from '../Event/Emitter.mjs'; 

import Ease from '../Animate/Ease.mjs';
import Coordinates from '../Math/Coordinates.mjs';

//window.screen.availWidth
//window.screen.availHeight

class Window extends EventEmitter{

    scrolling = false;
    scrollY = 0;
    scrollX = 0;

    constructor(){
        super();
        this.initialize();
    }

    get width(){
        return window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;
    }

    set width( width ){
        window.resizeTo( width, this.height );
    }

    get height(){
        return window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;
    }

    set height( height ){
        window.resizeTo( this.width, height );
    }

    get scrollTop(){
        return document.body.scrollTop || document.documentElement.scrollTop;
    }

    set scrollTop( px ){
        return window.scrollTo( this.scrollLeft, px );
    }

    get scrollTopMax(){
        return document.documentElement.scrollHeight - document.documentElement.clientHeight;
    }

    get scrollLeft(){
        return document.body.scrollLeft || document.documentElement.scrollLeft;
    }

    set scrollLeft( px ){
        return window.scrollTo( px, this.scrollTop );
    }

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