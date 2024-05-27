let Node;

class Helper {
    static async makeSelector(node) {
        if (!Node) {
            const Mod = await import("./Node.js");
            Node = Mod.default;
        }
        // Check if the element has an ID
        if (node.attributes?.id) return `#${node.attributes.id}`;

        // Check if the element has a unique class
        if (node.classList) {
            const uniqueClass = node.classList.find((cls) => Node.classIndex[cls] == 1);
            if (uniqueClass) {
                return `.${uniqueClass}`;
            }
        }

        // Check for a common parent with similar siblings
        const siblings = node.parent?.children;
        if (siblings?.length > 1) {
            const similarSiblings = siblings.filter(
                (sibling) => sibling && sibling.tagName && sibling.tagName === node.tagName
            );

            if (similarSiblings.length > 1) {
                const index = similarSiblings.indexOf(node) + 1;
                return `${node.tagName}:nth-child(${index})`;
            }
        }

        // Use :is() pseudo-class with tag name and attributes
        const tagName = node.tagName.toLowerCase();
        if (node.attributes) {
            const attributes = Array.from(node.attributes)
                .map((attr) => `[${attr.name}="${attr.value}"]`)
                .join("");
            return `${tagName}${attributes}`;
        }
    }

    static parseAttributeArray(attributeArray = []) {
        return attributeArray.reduce((result, value, index, array) => {
            if (index % 2 === 0) {
                const property = value;
                const nextValue = array[index + 1];
                if (nextValue !== undefined) {
                    result[property] = nextValue;
                }
            }
            return result;
        }, {});
    }
}

export default Helper;
