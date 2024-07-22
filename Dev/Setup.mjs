import * as url from "url";
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const root = window || global;

export function currentFile(_import) {
    return {
        name: url.fileURLToPath(_import.meta.url),
        dir: url.fileURLToPath(new URL(".", _import.meta.url)),
    };
}


root.dev =