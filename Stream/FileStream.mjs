import Emitter from "../Event/Emitter.mjs";

class FileStreamBuffer {
    file = null;

    constructor(file) {
        this.file = file;
    }

    read(from, to) {
        const slice = this.file.slice(from, to);

        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = () =>
                resolve(new Uint8Array(fileReader.result));
            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(slice);
        });
    }
}

class FileStream extends Emitter {
    head = 0;
    size = 0;
    type = null;
    source = null;

    chunkSize = 1024 * 1024; //1 MB

    paused = false;
    complete = false;
    callback = null;

    constructor(source) {
        super();
        this.source = source;
        this.size = source.size;
        this.type = source.type;

        this.buffer = new FileStreamBuffer(source);
    }

    read(chunkSize = this.chunkSize) {
        const from = this.head;
        const to = Math.min(this.head + this.chunkSize, this.size);

        this.buffer
            .read(from, to)
            .then(data => {
                //app.log('Stream HEAD', (to/1000000)+'MB' );
                this.head = to;

                if (this.head == this.size) {
                    this.complete = true;
                }

                this.emit("data", data, this.complete );

                if (this.complete) {
                    this.emit("complete");
                }
            })
            .catch(e => {
                this.emit("error", e);
            });

        return false;
    }

    pause() {
        this.paused = true;
    }

    seek(position) {
        this.head = position;
    }
}

export default FileStream;