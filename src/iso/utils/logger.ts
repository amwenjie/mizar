
interface IGetLogger {
    getLogger(category?: string): ILogger;
    [propName: string]: any;
}
interface ILogger {
    info: (...args: any) => void;
    log: (...args: any) => void;
    warn: (...args: any) => void;
    error: (...args: any) => void;
    [propName: string]: any;
}

let defaultLogger: IGetLogger;

let isConfigured = false;
declare const IS_DEBUG_MODE;
class Logger {
    private suffix: string = "";
    private supportMethods = ["log", "info", "warn", "error"];
    constructor(suffix) {
        this.suffix = suffix;
    }

    public log(...args: any[]) {
        if (IS_DEBUG_MODE) {
            console.log(this.suffix, ...args);
        }
    }
    public debug(...args: any[]) {
        this.log(...args);
    }
    public info(...args: any[]) {
        this.log(...args);
    }
    public warn(...args: any[]) {
        if (IS_DEBUG_MODE) {
            console.warn(this.suffix, ...args);
        }
    }
    public error(...args: any[]) {
        console.error(this.suffix, ...args);
    }
}

export function setLogger(logger: IGetLogger) {
    if (isConfigured) {
        console.warn("logger has been used, can not set");
        return;
    }
    defaultLogger = logger;
    isConfigured = true;
}

export default function getLogger(): any {
    if (!isConfigured) {
        defaultLogger = {
            getLogger: (suffix) => {
                return new Logger(suffix);
            }
        };
    }
    isConfigured = true;
    return defaultLogger;
}