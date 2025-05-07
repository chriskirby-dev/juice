class Tree {
    constructor(vdom) {
        this.children = [];
        this.parent = null;

        this.vdom = vdom;
        this.initialize();
    }

    addNode(node, scope = []) {
        console.log("addNode", node, scope);
        if (typeof node == "number") node = this.vdom.getNodeByBackendId(node);

        if (scope == null) scope = node.data;

        if (node.children) {
            node.children.forEach((child) => {
                this.addNode(child, node);
            });
        }
    }

    rootNode(root) {}

    toJson() {
        return this.data;
    }

    initialize() {
        const tree = Object.create(null);
        tree.attrs = {};
        tree.children = [];
        this.data = tree;
        this.addNode(this.vdom.root, tree);
    }
}

export default Tree;
