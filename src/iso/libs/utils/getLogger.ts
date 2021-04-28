import state from "../state";

class Logger {
    private suffix: string = "";
    private supportMethods = ["log", "info", "warn", "error"];
    constructor(suffix) {
        this.suffix = suffix;
    }

    public log(...args: any[]) {
        if (state.isDebug) {
            console.log(this.suffix, ...args);
        }
    }
    public info(...args: any[]) {
        if (state.isDebug) {
            console.log(this.suffix, ...args);
        }
    }
    public warn(...args: any[]) {
        if (state.isDebug) {
            console.warn(this.suffix, ...args);
        }
    }
    public error(...args: any[]) {
        console.error(this.suffix, ...args);
    }
}

export function getLogger (suffix) {
    return new Logger(suffix);
}