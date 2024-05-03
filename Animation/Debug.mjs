class AnimationDebug {

    #defined = {};
    parent = null;

    constructor(){
        this.initialize();
    }

    set fps( fps ){
        this.#defined.fps = fps;
        this.list.setData('FPS', fps);
    }

    set time( ms ){
        this.#defined.ms = ms;
        this.list.setData('Time', ms);
        if(!this.defer) this.list.render();
    }

    appendTo( parent ){
        this.parent = parent;
    }

    initialize(){
        const list = document.createElement('info-list');
        list.addData('FPS', 0);
        list.addData('Time', 0);
        this.list = list;
    }

}

export default AnimationDebug;