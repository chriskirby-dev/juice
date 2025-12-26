import fs from "node:fs";
import path from "path";
import * as url from "url";
import os from "os";
import crypto from "crypto";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const toolkitPath = path.resolve("F://FluxScrapper/resources/js/verdor/electron-toolkit/Renderer/");

const DEFAULT_PRELOAD = path.resolve(toolkitPath, "../Renderer/preload.mjs");
const DEFAULT_HOMEPAGE = path.resolve(toolkitPath, "../views/default.html");

let tmp = os.tmpdir().replace(/\\/g, "/");
const TMP_DIR = path.join(tmp, "electron-toolkit");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const JUICE_PATH = "file:///" + path.resolve(__dirname, "../../").replace(/\\/g, "/");

async function removeAllFilesInDirectory(directoryPath) {
    try {
        const files = await fs.readdir(directoryPath);

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const stat = await fs.stat(filePath);

            if (stat.isFile()) {
                await fs.unlink(filePath);
                console.log(`File ${filePath} removed.`);
            } else if (stat.isDirectory()) {
                await removeAllFilesInDirectory(filePath);
                await fs.rmdirSync(filePath, { recursive: true });
                console.log(`Directory ${filePath} removed.`);
            }
        }
    } catch (error) {
        console.error(`Error removing files in ${directoryPath}: ${error}`);
    }
}

removeAllFilesInDirectory(TMP_DIR);

const electronBrowserWindowOptions = [
    "width",
    "height",
    "x",
    "y",
    "useContentSize",
    "center",
    "minWidth",
    "minHeight",
    "maxWidth",
    "maxHeight",
    "resizable",
    "movable",
    "minimizable",
    "maximizable",
    "closable",
    "focusable",
    "alwaysOnTop",
    "fullscreen",
    "fullscreenable",
    "simpleFullscreen",
    "skipTaskbar",
    "kiosk",
    "title",
    "icon",
    "frame",
    "parent",
    "modal",
    "acceptFirstMouse",
    "disableAutoHideCursor",
    "autoHideMenuBar",
    "enableLargerThanScreen",
    "backgroundColor",
    "hasShadow",
    "opacity",
    "transparent",
    "type",
    "titleBarStyle",
    "trafficLightPosition",
    "fullscreenWindowTitle",
    "thickFrame",
    "vibrancy",
    "zoomToPageWidth",
    "tabbingIdentifier",
    "webPreferences",
    "show",
    "paintWhenInitiallyHidden",
    "safeStorageKey",
    "visualEffectState",
];

const electronWebPreferencesOptions = [
    "devTools",
    "nodeIntegration",
    "nodeIntegrationInWorker",
    "nodeIntegrationInSubFrames",
    "preload",
    "sandbox",
    "contextIsolation",
    "enableRemoteModule",
    "affinity",
    "webSecurity",
    "allowRunningInsecureContent",
    "images",
    "java",
    "textAreasAreResizable",
    "webgl",
    "webviewTag",
    "spellcheck",
    "enableWebSQL",
    "v8CacheOptions",
    "enablePreferredSizeMode",
    "disableHtmlFullscreenWindowResize",
    "backgroundThrottling",
    "offscreen",
    "transparentBackground",
    "disableDialogs",
    "navigateOnDragDrop",
    "autoplayPolicy",
    "safeDialogs",
    "safeDialogsMessage",
    "disableBlinkFeatures",
    "enableBlinkFeatures",
    "defaultFontFamily",
    "defaultFontSize",
    "defaultMonospaceFontSize",
    "minimumFontSize",
    "defaultEncoding",
    "offscreen",
    "partition",
    "zoomFactor",
    "javascript",
    "webaudio",
    "webauthn",
    "webgl2",
    "plugins",
    "siteInstance",
    "disableSiteInstanceRemoval",
    "additionalArguments",
    "extraHeaders",
];

const DEFAULT_OPTIONS = {
    title: "Vision View",
    show: true,
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        preload: DEFAULT_PRELOAD,
    },
};

function buildPreload(contents) {
    const urlPattern = /^(https?:\/\/|\/\/|\/|\.\.?\/|[a-zA-Z]:\\|file:\/\/)/;

    let code = contents
        .map((source) => {
            if (urlPattern.test(source)) {
                try {
                    return fs.readFileSync(source, "utf8");
                } catch (e) {
                    console.error(e);
                    return "";
                }
            } else {
                return source;
            }
        })
        .join("\n");

    const { imports, cleanedCode } = extractAndRemoveImports(code);

    const updatedImports =
        imports
            .join("\n")
            .replace(/(JUICE_PATH)/g, JUICE_PATH)
            .replace(/(ROOT_DIR)/g, process.cwd().replace(/\\/g, "/")) + "\n \n";

    //console.log(updatedImports);

    return (
        updatedImports +
        cleanedCode.replace(/(JUICE_PATH)/g, JUICE_PATH).replace(/(ROOT_DIR)/g, process.cwd().replace(/\\/g, "/"))
    );
}

function extractAndRemoveImports(code) {
    const importRegex = /^import\s+[^;]+;/gm; // Matches full import statements

    // Extract imports
    const imports = code.match(importRegex) || [];

    // Remove imports from the original code
    const cleanedCode = code.replace(importRegex, "").trim();

    return { imports, cleanedCode };
}

function mergeOptions(keys, options = {}, defaults) {
    return keys.reduce((acc, key) => {
        if (key === "preload") {
            const ploads = Array.isArray(options[key]) ? options[key] : [options[key] || ""];
            if (!ploads.includes(DEFAULT_PRELOAD)) {
                ploads.unshift(DEFAULT_PRELOAD);
            }
            ploads.push(`
                ipcRenderer.send("preloaded");
            `);
            //  console.log("preloads", ploads);
            options[key] = ploads;

            const preloadScript = buildPreload(ploads);

            // console.log("preloadScript", preloadScript);
            const hash = crypto.createHash("sha256");
            hash.update(preloadScript);
            const hex = hash.digest("hex");
            const preloadPath = path.join(TMP_DIR, `preload-${hex}.mjs`);
            if (!fs.existsSync(preloadPath)) {
                fs.writeFileSync(preloadPath, preloadScript);
            }
            //acc[key] = `data:text/javascript;base64,${Buffer.from(buildPreload(ploads)).toString("base64")}`;
            acc[key] = preloadPath;
            return acc;
        }
        if (key === "webPreferences") {
            acc[key] = mergeOptions(electronWebPreferencesOptions, options[key] || {}, defaults[key]);
            return acc;
        }
        if (options[key] !== undefined) {
            acc[key] = options[key];
        } else if (defaults[key] !== undefined) {
            acc[key] = defaults[key];
        }
        return acc;
    }, {});
}

export const DEFAULT_APPLIABLE_OPTIONS = [
    "config",
    "debug",
    "isMainView",
    "dependants:depends",
    "template",
    "width",
    "height",
    "x",
    "y",
];

export function extractOptions(options) {
    return mergeOptions(electronBrowserWindowOptions, options, DEFAULT_OPTIONS);
}

export default electronBrowserWindowOptions;