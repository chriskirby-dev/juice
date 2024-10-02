class JuiceWorker {
    constructor(_worker) {
        if (typeof _worker == "function") {
            const blob = new Blob(
                [
                    `
                self.onmessage = ${_worker.toString()};
            `,
                ],
                { type: "application/javascript" }
            );

            _worker = URL.createObjectURL(blob);
        }
    }

    use(path, data) {
        return new Promise((resolve) => {
            const worker = new Worker(path);

            worker.onmessage = (event) => {
                const data = event.data;
                if (data.error) {
                } else {
                }
            };

            worker.postMessage({
                chunk: data,
            });
        });
    }
}

export default JuiceWorker;
