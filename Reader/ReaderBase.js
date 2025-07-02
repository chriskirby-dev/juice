class ReaderBase {
    constructor(content) {
        this.content = content;
        this.index = 0;
    }

    get complete() {
        return this.index >= this.content.length;
    }

    get current() {
        return this.content[this.index];
    }

    get remaining() {
        return this.content.slice(this.index);
    }

    get(i) {
        return this.content[i];
    }

    next() {
        this.index++;
        return this.content[this.index];
    }

    previous() {
        this.index--;
        return this.content[this.index];
    }
    read(length, slient = false) {
        const start = this.index;
        const end = this.index + length;
        if (!slient) this.index += length;
        this.lastRead = { start, end, content: this.content.slice(start, end) };
        return this.lastRead.content;
    }

    readChunk(start, length, slient = false) {
        const end = start + length;
        this.lastRead = { start, end, content: this.content.slice(start, end) };
        if (!slient) this.index = end;
        return this.lastRead.content;
    }

    readAround(charsLeft, charsRight, slient = false) {
        const start = this.index - charsLeft;
        const end = this.index + charsRight;
        if (!slient) this.index += charsRight;
        return this.readChunk(start, end);
    }

    readUntil(char, offset = 0, slient = false) {
        const start = this.index;
        const end = this.content.indexOf(char, this.index);
        if (end == -1) return this.readOut(slient);
        if (!slient) this.index = end + offset;
        return this.read(end + offset - start, slient);
    }

    readOut(slient = false) {
        const start = this.index;
        const end = this.content.length;
        if (!slient) this.index = this.content.length + 1;
        return this.readChunk(start, end, slient);
    }

    jumpTo(index) {
        this.index = index;
    }

    findNext(char) {
        return this.content.indexOf(char, this.index);
    }

    findPrevious(char) {
        return this.content.lastIndexOf(char, this.index);
    }

    hasLeft(char) {
        return this.content.slice(this.index, this.content.length).includes(char);
    }

    has(char) {
        return this.content.includes(char, this.index);
    }

    reset() {
        this.index = 0;
    }
}

export default ReaderBase;
