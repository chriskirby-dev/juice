import * as sass from "sass";
async function fetchFileContents(filePath) {
    if (filePath == null) {
        throw new Error("filePath cannot be null or undefined");
    }

    const response = await fetch(filePath);

    if (!response.ok) {
        throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
    }

    return await response.text();
}

export async function loadFileToString(filePath) {
    if (filePath === null || filePath === undefined) {
        throw new Error("filePath cannot be null or undefined");
    }
    const contents = await fetchFileContents(filePath);
    if (!contents) {
        throw new Error(`Failed to fetch contents of ${filePath}`);
    }
    const compiled = compileString(contents);
    if (!compiled) {
        throw new Error(`Failed to compile contents of ${filePath}`);
    }
    return compiled;
}

export async function loadFileToTag(filePath, tag = "style") {
    if (!filePath) {
        throw new Error("filePath cannot be null or undefined");
    }
    const contents = await fetchFileContents(filePath);
    console.log(contents);
    if (!contents) {
        throw new Error(`Failed to fetch contents of ${filePath}`);
    }
    const compiled = compileString(contents);
    if (!compiled) {
        throw new Error(`Failed to compile contents of ${filePath}`);
    }
    const node = document.createElement(tag);
    node.innerHTML = compiled;
    return node;
}

export async function loadFileToDocument(filePath) {
    if (!filePath) {
        throw new Error("filePath cannot be null or undefined");
    }
    const tag = await loadFileToTag(filePath);
    if (!tag) {
        throw new Error(`Failed to load file contents of ${filePath} into a tag`);
    }
    if (!document.head) {
        throw new Error("document.head is null or undefined");
    }
    document.head.appendChild(tag);
}

export function compileString(string) {
    if (!string) {
        throw new Error("string cannot be null or undefined");
    }
    try {
        const result = sass.compileString(string);
        if (!result) {
            throw new Error("Failed to compile string");
        }
        const css = result.css;
        if (!css) {
            throw new Error("Failed to extract css from result");
        }
        return css;
    } catch (error) {
        throw new Error(`Failed to compile string: ${error}`);
    }
}

export async function load(...filePaths) {
    if (!filePaths || filePaths.length < 1) {
        throw new Error("filePaths cannot be null or empty");
    }
    const promises = [];
    for (const path of filePaths) {
        if (!path) {
            throw new Error("filePath cannot be null or undefined");
        }
        promises.push(loadFileToString(path));
    }
    return Promise.all(promises).catch((error) => {
        throw new Error(`Failed to load files: ${error}`);
    });
}

export default sass;
