import log4js from "log4js";

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
        defaultLogger = log4js;
        const config = {
            "appenders": {
                "access": {
                    "type": "dateFile",
                    "filename": "logs/access.log",
                    "pattern": "-yyyy-MM-dd",
                    "category": "http"
                },
                "app": {
                    "type": "file",
                    "filename": "logs/app.log",
                    "maxLogSize": 10485760,
                    "numBackups": 3
                },
                "errorFile": {
                    "type": "file",
                    "filename": "logs/errors.log"
                },
                "errors": {
                    "type": "logLevelFilter",
                    "level": "ERROR",
                    "appender": "errorFile"
                },
                "out": {
                    "type": "stdout",
                    "layout": {
                        "type": "colored"
                    }
                }
            },
            "categories": {
                "debug": { "appenders": ["out"], "level": "DEBUG" },
                "default": { "appenders": ["app", "errors"], "level": "DEBUG" },
                "http": { "appenders": ["access"], "level": "DEBUG" }
            }
        };
        if (process.env.NODE_ENV === 'production') {
            config["pm2"] = true;
            config["pm2InstanceVar"] = "PM2_INSTANCE_ID";
        }
        defaultLogger.configure(config);
    }
    isConfigured = true;
    return defaultLogger;
}