import EventEmitter from "../Event/Emitter.mjs";
import { getAvailableCores } from "./Helper.js";

const cores = getAvailableCores();

class JuiceWorker extends EventEmitter {
    static fromFunction(_worker) {
        const blob = new Blob([` self.onmessage = ${_worker.toString()}; `], { type: "application/javascript" });
        return URL.createObjectURL(blob);
    }

    constructor(path, options = {}) {
        super();
        this.path = path;
        this.options = options;
        this.workers = [];
        this._queue = [];
    }

    queue(message) {
        return new Promise((resolve, reject) => {
            this._queue.push({ message, resolve, reject });
        });
    }

    work() {
        if (this._queue.length) {
            for (const worker of this.workers) {
                worker.doWork();
            }
        }
    }

    spawn() {
        if (!this.options.type) this.options.type = "module";
        const worker = new Worker(this.path, this.options);

        let job = null; // Current item from the queue
        let error = null; // Error that caused the worker to crash

        function doWork() {
            if (!job && this._queue.length) {
                // If there's a job in the queue, send it to the worker
                job = this._queue.shift();
                worker.postMessage(job.message);
            }
        }

        worker.onmessage = (e) => {
            const { event, message, error: err, code } = e.data;
            if (message) {
                return job.resolve(message);
            }
            if (event) {
                switch (event) {
                    case "online":
                        this.workers.push({ doWork });
                    case "exit":
                        this.workers = this.workers.filter((w) => w.doWork !== doWork);
                        if (job) {
                            job.reject(err || new Error("worker died"));
                        }
                        if (code !== 0) {
                            console.error(`worker exited with code ${code}`);
                            this.emit("exit", code);
                            this.spawn();
                        }
                    case "idle":

                    case "busy":
                        break;
                }
                this.emit(event);
            }
        };

        worker.onerror = (e) => {
            error = e;
        };
    }

    initialize() {
        new Array(cores).fill(null).forEach(this.spawn.bind(this));
    }
}

export default JuiceWorker;
