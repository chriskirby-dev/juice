const root = window || global;
const config = {};

const consoleStyles = {
    BLACK: "\x1B[30m",
    RED: "\x1B[31m",
    GREEN: "\x1B[32m",
    YELLOW: "\x1B[33m",
    BLUE: "\x1B[34m",
    PURPLE: "\x1B[35m",
    CYAN: "\x1B[36m",
    WHITE: "\x1B[37m",

    //background color
    BLACKB: "\x1B[40m",
    REDB: "\x1B[41m",
    GREENB: "\x1B[42m",
    YELLOWB: "\x1B[43m",
    BLUEB: "\x1B[44m",
    PURPLEB: "\x1B[45m",
    CYANB: "\x1B[46m",
    WHITEB: "\x1B[47m",

    //bold
    B: "\x1B[1m",
    BOFF: "\x1B[22m",

    //italics
    I: "\x1B[3m",
    IOFF: "\x1B[23m",

    //underline
    U: "\x1B[4m",
    UOFF: "\x1B[24m",

    //invert
    R: "\x1B[7m",
    ROFF: "\x1B[27m",

    //reset
    RESET: "\x1B[0m",
};

class Log {
    get parseTrace() {
        this.log = [];
        this.debug = false;
    }
}

class ConsoleMessage {
    static parse(raw) {
        const stackRegex = /^(?:\s*at\s+)?(?:([\w$.]+)\s*\()?(?:(.*?)(?::(\d+):(\d+))?\s*\)?|\[.*?\])$/;
        const matches = raw.trim().match(stackRegex);
        let resp;
        if (matches) {
            resp = {};
            let file = matches[2];
            let method = matches[1];
            if (file && file.includes("(")) {
                const parts = file.split(/[\(\)]/g);
                method = parts[0] + "()";
                resp.file = parts[1];
            }
            if (method) resp.method = method === "Object.<anonymous>" ? "(anonymous)" : method;
            if (matches[3]) resp.line = parseInt(matches[3]);
            if (matches[4]) resp.column = parseInt(matches[4]);
        }
        return resp;
    }

    static file(line) {
        if (!line) return null;
        const parsed = ConsoleMessage.parse(line);
        return {
            name: "Test Name",
            get file() {
                if (parsed.file) {
                    return {
                        path: parsed.file,
                        basename: parsed.file.split("/").pop(),
                        method: parsed.method,
                        line: parsed.line,
                        column: parsed.column,
                        raw: line,
                    };
                } else {
                    return line;
                }
            },
        };
        return FileMessage;
    }
}

root.stackTrace = function stackTrace(parsed = false) {
    const error = new Error();
    const stack = error.stack || "";
    //console.log(stack);
    const stackArray = stack.split("\n").slice(4);
    //console.log(stackArray);
    // Remove the first two lines which are the error message and this function call
    return parsed ? stackArray.map(ConsoleMessage.parse) : stackArray;
};

root.caller = function caller() {
    return stackTrace(true);
};

root.log = () => {
    return {
        write: (file) => {
            config.writeTo = file;
        },
    };
};

["log", "warn", "error", "trace"].forEach(function alterConsole(methodName) {
    const originalMethod = console[methodName];

    console["_" + methodName] = (...args) => {
        let initiator = "unknown place";
        const _caller = caller()
            .map((line) => {
                let str = "";
                if (line.file) str += `${consoleStyles.BLUE} file:  ${consoleStyles.WHITE} ${line.file}`;
                if (line.method) str += `${consoleStyles.BLUE}     method:${consoleStyles.WHITE} ${line.method}`;

                if (line.line)
                    str += `${consoleStyles.BLUE} line:${consoleStyles.WHITE}${line.line} ${consoleStyles.BLUE}col: ${consoleStyles.WHITE}${line.column}`;
                //if (line.column) str += ` ${consoleStyles.BLUE} col:${consoleStyles.WHITE}${line.column}`;

                return str;
            })
            .join("\n");

        return originalMethod.apply(console, [_caller, ...args]);
        // writeToLog(`LOG  at ${initiator}` + "\n", ...args, "\n\n");
    };
});

root.debug = console._log;
