// sqliteWorker.js
import Database from "better-sqlite3";

let db;
const statements = new Map();

self.onmessage = (event) => {
    const port = event.data?.port;
    if (!(port instanceof MessagePort)) return;

    port.onmessage = async ({ data }) => {
        const { id, action, sql, parameters = [], statementId, filename } = data;

        try {
            if (action === "open") {
                db = new Database(filename || ":memory:");
                port.postMessage({ id, result: "opened" });
            } else if (action === "prepare") {
                const stmt = db.prepare(sql);
                statements.set(statementId, stmt);
                port.postMessage({ id, result: "prepared" });
            } else if (action === "run") {
                const stmt = statements.get(statementId) || db.prepare(sql);
                const result = stmt.run(...parameters);
                port.postMessage({ id, result });
            } else if (action === "get") {
                const stmt = statements.get(statementId) || db.prepare(sql);
                const result = stmt.get(...parameters);
                port.postMessage({ id, result });
            } else if (action === "all") {
                const stmt = statements.get(statementId) || db.prepare(sql);
                const result = stmt.all(...parameters);
                port.postMessage({ id, result });
            } else if (action === "close") {
                db.close();
                port.postMessage({ id, result: "closed" });
            } else {
                port.postMessage({ id, error: "Unknown action" });
            }
        } catch (err) {
            port.postMessage({ id, error: err.message });
        }
    };
};