/**
 * File streaming utilities for reading large files in chunks.
 * Provides event-based streaming with pause/resume support.
 * @module Stream/FileStream
 */

import Emitter from "../Event/Emitter.mjs";

/**
 * Buffers and reads file chunks using FileReader API.
 * @class FileStreamBuffer
 * @param {File} file - File object to buffer
 * @private
 */
class FileStreamBuffer {
    /** @type {File} Source file */
    file = null;

    constructor(file) {
        this.file = file;
    }

    /**
     * Reads a chunk of the file from start to end position.
     * @param {number} from - Start byte position
     * @param {number} to - End byte position
     * @returns {Promise<Uint8Array>} Promise resolving to chunk data
     */
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

/**
 * Streams file content in chunks with pause/resume capability.
 * @class FileStream
 * @extends Emitter
 * @param {File} source - File object to stream
 * @fires FileStream#data When chunk data is available
 * @fires FileStream#complete When streaming completes
 * @example
 * const stream = new FileStream(file);
 * stream.on('data', (chunk, isComplete) => {
 *   processChunk(chunk);
 * });
 * stream.start();
 */
class FileStream extends Emitter {
    /** @type {number} Current read position */
    head = 0;
    /** @type {number} Total file size */
    size = 0;
    /** @type {string} File MIME type */
    type = null;
    /** @type {File} Source file */
    source = null;
    /** @type {number} Chunk size in bytes (default 1MB) */
    chunkSize = 1024 * 1024; //1 MB
    /** @type {boolean} Whether streaming is paused */
    paused = false;
    /** @type {boolean} Whether streaming is complete */
    complete = false;
    /** @type {Function} Stream callback */
    callback = null;
    /** @type {FileStreamBuffer} Internal buffer */
    buffer;

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