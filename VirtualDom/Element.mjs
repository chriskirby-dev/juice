const vElement = (tag, attributes, children, options = {}) => {
    const vElem = Object.create(null);

    return Object.assign(vElem, {
        tag,
        attributes,
        children,
        options,
    });
};

export function nextId() {
    return Math.random().toString(36).substring(2, 9);
}

export default vElement;
