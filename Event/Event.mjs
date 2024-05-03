import Emitter from './Emitter.mjs';


export function cancel(e){
    e.preventDefault();
    e.stopPropagation();
    return false;
}

export const Emitter = Emitter;


class Event {
    
    static Emitter = Emitter;


}

export default Event;