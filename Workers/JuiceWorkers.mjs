const MAX_WORKERS = navigator.hardwareConcurrency || 4;
import JuiceWorker from "./JuiceWorker.mjs";
class JuiceWorkers {
    results = [];
    constructor() {}

    static *chunk(array, count) {
        let i = 0;
        const chunkSize = Math.ceil(array.length / (count || MAX_WORKERS));
        while (i < array.length) {
            i += chunkSize;
            yield array.slice(i - chunkSize, i);
        }
    }

    static startWorker(chunk, index, result) {
        console.log(this.pointer);
        const worker = new Worker(this.pointer);

        return new Promise((resolve) => {
            worker.onmessage = (event) => {
                console.log("WORKER EVENT", event);
                result.splice(index, 0, ...event.data);
                resolve(event.data);
            };
            worker.postMessage({
                type: "job",
                chunk: chunk,
            });
        });
    }

    static job(pointer, data) {
        const self = this;
        const promises = [];
        const result = [];

        console.time("worker");

        const blob = new Blob(
            [
                `
            self.onmessage = ${pointer.toString()};
        `,
            ],
            { type: "application/javascript" }
        );

        this.pointer = URL.createObjectURL(blob);

        this.promises = [];
        const dataChunks = this.chunk(data, MAX_WORKERS);
        let idx = 0;

        for (let chunk of dataChunks) {
            this.promises.push(this.startWorker(chunk, idx, result));
            idx += chunk.length;
        }

        return Promise.all(this.promises).then(() => {
            console.timeEnd("worker");
            return result;
        });
    }

    create(fn, data) {
        return this.use(fn, data);
    }
}

export default JuiceWorkers;
