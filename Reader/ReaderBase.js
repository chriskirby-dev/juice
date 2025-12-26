/**
 * ReaderBase provides a stateful reader for string content with cursor-based navigation.
 * Allows sequential reading, jumping, and searching through content.
 * @class ReaderBase
 * @example
 * const reader = new ReaderBase('Hello World');
 * console.log(reader.current); // 'H'
 * reader.next();
 * console.log(reader.current); // 'e'
 */
class ReaderBase {
    /**
     * Creates a new ReaderBase instance.
     * @param {string} content - The content to read
     */
    constructor(content) {
        this.content = content;
        this.index = 0;
    }

    /**
     * Checks if all content has been read.
     * @returns {boolean} True if the reader has reached the end of content
     */
    get complete() {
        return this.index >= this.content.length;
    }

    /**
     * Gets the character at the current index.
     * @returns {string} The current character
     */
    get current() {
        return this.content[this.index];
    }

    /**
     * Gets the remaining unread content from current position.
     * @returns {string} The remaining content
     */
    get remaining() {
        return this.content.slice(this.index);
    }

    /**
     * Gets the character at a specific index.
     * @param {number} i - The index to get
     * @returns {string} The character at the specified index
     */
    get(i) {
        return this.content[i];
    }

    /**
     * Moves to the next character and returns it.
     * @returns {string} The next character
     */
    next() {
        this.index++;
        return this.content[this.index];
    }

    /**
     * Moves to the previous character and returns it.
     * @returns {string} The previous character
     */
    previous() {
        this.index--;
        return this.content[this.index];
    }
    /**
     * Reads a specified number of characters from the current position.
     * @param {number} length - Number of characters to read
     * @param {boolean} [slient=false] - If true, doesn't advance the index
     * @returns {string} The read content
     */
    read(length, slient = false) {
        const start = this.index;
        const end = this.index + length;
        if (!slient) this.index += length;
        this.lastRead = { start, end, content: this.content.slice(start, end) };
        return this.lastRead.content;
    }

    /**
     * Reads a chunk of content from a specific position.
     * @param {number} start - Starting index
     * @param {number} length - Number of characters to read
     * @param {boolean} [slient=false] - If true, doesn't advance the index
     * @returns {string} The read content
     */
    readChunk(start, length, slient = false) {
        const end = start + length;
        this.lastRead = { start, end, content: this.content.slice(start, end) };
        if (!slient) this.index = end;
        return this.lastRead.content;
    }

    /**
     * Reads characters around the current position.
     * @param {number} charsLeft - Number of characters to read before current position
     * @param {number} charsRight - Number of characters to read after current position
     * @param {boolean} [slient=false] - If true, doesn't advance the index
     * @returns {string} The read content
     */
    readAround(charsLeft, charsRight, slient = false) {
        const start = this.index - charsLeft;
        const end = this.index + charsRight;
        if (!slient) this.index += charsRight;
        return this.readChunk(start, end);
    }

    /**
     * Reads content until a specific character is found.
     * @param {string} char - The character to read until
     * @param {number} [offset=0] - Additional offset after the found character
     * @param {boolean} [slient=false] - If true, doesn't advance the index
     * @returns {string} The read content
     */
    readUntil(char, offset = 0, slient = false) {
        const start = this.index;
        const end = this.content.indexOf(char, this.index);
        if (end == -1) return this.readOut(slient);
        if (!slient) this.index = end + offset;
        return this.read(end + offset - start, slient);
    }

    /**
     * Reads all remaining content from the current position to the end.
     * @param {boolean} [slient=false] - If true, doesn't advance the index
     * @returns {string} The remaining content
     */
    readOut(slient = false) {
        const start = this.index;
        const end = this.content.length;
        if (!slient) this.index = this.content.length + 1;
        return this.readChunk(start, end, slient);
    }

    /**
     * Jumps to a specific index in the content.
     * @param {number} index - The index to jump to
     */
    jumpTo(index) {
        this.index = index;
    }

    /**
     * Finds the next occurrence of a character from the current position.
     * @param {string} char - The character to find
     * @returns {number} The index of the character, or -1 if not found
     */
    findNext(char) {
        return this.content.indexOf(char, this.index);
    }

    /**
     * Finds the previous occurrence of a character before the current position.
     * @param {string} char - The character to find
     * @returns {number} The index of the character, or -1 if not found
     */
    findPrevious(char) {
        return this.content.lastIndexOf(char, this.index);
    }

    /**
     * Checks if a character exists in the remaining content.
     * @param {string} char - The character to check
     * @returns {boolean} True if the character exists in remaining content
     */
    hasLeft(char) {
        return this.content.slice(this.index, this.content.length).includes(char);
    }

    /**
     * Checks if a character exists from the current position onwards.
     * @param {string} char - The character to check
     * @returns {boolean} True if the character exists
     */
    has(char) {
        return this.content.includes(char, this.index);
    }

    /**
     * Resets the reader to the beginning of the content.
     */
    reset() {
        this.index = 0;
    }
}

export default ReaderBase;
