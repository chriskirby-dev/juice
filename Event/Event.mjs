import { default as _Emitter } from "./Emitter.mjs";

export function cancel(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

export const Emitter = _Emitter;

class Event {
    static Emitter = _Emitter;
}

export default Event;
