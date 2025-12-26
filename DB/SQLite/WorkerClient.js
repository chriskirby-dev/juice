// main.js
import { MessageChannel } from "node:worker_threads"; // Only for types; not used if running in browser or bun
import { Worker } from "node:worker_threads"; // Optional replacement for real web Worker (Node only)

const callbacks = new Map();

async function getAvailableCores() {
    // Browser: navigator.hardwareConcurrency
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
        return navigator.hardwareConcurrency;
    }

    // Node.js (modern): os.availableParallelism()
    try {
        const os = await import("os");
        os = os.default;
        if (typeof os.availableParallelism === "function") {
            return os.availableParallelism();
        }
        if (Array.isArray(os.cpus)) {
            return os.cpus().length;
        }
    } catch (e) {
        // Likely not Node.js, or restricted environment
    }

    // Fallback for unknown environments
    return 1;
}

const cores = getAvailableCores();

class SQLiteWorker {
    constructor(dbpath) {
        this.dbpath = dbpath;
        this.queue = new Map();
        this.queueId = 0;
    }

    open(filename) {
        return this.send("open", { filename });
    }

    prepare(sql) {
        return this.send("prepare", { sql });
    }

    run(sql, ...params) {
        return this.send("run", { sql, params });
    }

    get(sql, ...params) {
        return this.send("get", { sql, params });
    }

    all(sql, ...params) {
        return this.send("all", { sql, params });
    }

    exec(sql) {
        return this.send("exec", { sql });
    }

    close() {
        return this.send("close");
    }

    send({ action, sql, parameters }) {
        const { port } = this;
        return new Promise((resolve, reject) => {
            const id = ++this.queueId;
            callbacks.set(id, { resolve, reject });
            port.postMessage({ id, action, sql, parameters });
        });
    }

    initialize() {
        const worker = new Worker(new URL(this.dbpath, import.meta.url), { type: "module" });
        this._worker = worker;
        const { port1, port2 } = new MessageChannel();

        port1.postMessage({ port: port2 }, [port2]);

        this.port = port1;

        port1.onmessage = ({ data }) => {
            const { id, result, error } = data;
            const cb = callbacks.get(id);
            if (cb) {
                callbacks.delete(id);
                error ? cb.reject(new Error(error)) : cb.resolve(result);
            }
        };

        this.open(this.dbpath);
    }
}

function spawnWorkers(dbpath) {
    dbpath = new URL(dbpath, import.meta.url);
    new Array(cores).fill(null).forEach(function spawn() {
        const worker = new Worker(dbpath, { type: "module" });
        const { port1: localPort, port2: remotePort } = new MessageChannel();

        worker.onmessage = ({ data }) => {
            const { port } = data;
            port.postMessage({ port: localPort }, [localPort]);
        };

        worker.onerror = (err) => {
            localPort.postMessage({ error: err.message });
        };

        worker.onmessageerror = (err) => {
            localPort.postMessage({ error: err.message });
        };

        const originalTerminate = worker.terminate;
        let manualTerminate = false;
        worker.terminate = () => {
            manualTerminate = true;
            localPort.postMessage({ event: "exit" });
            originalTerminate();
        };

        localPort.postMessage({ port: remotePort }, [remotePort]);

        localPort.onmessage = ({ data }) => {
            const { event, id, result, error } = data;
            if (event) {
                switch (event) {
                    case "online":
                        workers.push({ takeWork });
                    case "offline":

                    case "error":

                    case "exit":
                        break;
                }
            }
            const cb = callbacks.get(id);
            if (cb) {
                callbacks.delete(id);
                error ? cb.reject(new Error(error)) : cb.resolve(result);
            }
        };
    });
}
/*
// Example usage
(async () => {
    await send("open", { filename: "limbo.db" });
    await send("run", { sql: "CREATE TABLE IF NOT EXISTS test (id INTEGER, value TEXT)" });
    await send("run", { sql: "INSERT INTO test (value) VALUES (?)", params: ["Hello from portal"] });

    const row = await send("get", { sql: "SELECT * FROM test ORDER BY id DESC LIMIT 1" });
    console.log("Last row:", row);

    await send("close");
    worker.terminate?.(); // Optional
})();
*/

export default SQLiteWorker;