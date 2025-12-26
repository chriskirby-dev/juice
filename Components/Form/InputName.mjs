import Str from "../../Util/String.mjs";

class InputName {
    text;
    label;
    id;
    constructor(text) {
        this.text = text;
    }

    toId() {
        return (
            this.id ||
            this.text
                .replace(/\s+/g, "-") // Replace spaces with -
                .replace(/[^\w\-]+/g, "") // Remove all non-word chars
                .replace(/\-\-+/g, "-") // Replace multiple - with single -
                .replace(/^-+/, "") // Trim - from start of text
                .replace(/-+$/, "")
        ); // Trim - from end of text
    }

    toLabel() {
        return (
            this.label ||
            Str.ucwords(this.text)
                .replace(/[_-]/g, "-") // Replace spaces with -
                .replace(/[^\w\-]+/g, "") // Remove all non-word chars
                .replace(/^-+/, "") // Trim - from start of text
                .replace(/-+$/, "")
        ); // Trim - from end of text
    }

    toString() {
        return `${this.text}`;
    }
}

export default InputName;