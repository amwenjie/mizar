import fs from "fs-extra";
import { createRequire } from "node:module";
import path from "node:path";
import klaw from "klaw";
import os from "node:os";
import { pathToFileURL } from 'node:url';
import { IDynamicRoute } from "../../interface.js";
import isFunction from "../../iso/utils/isFunction.js";
import getLogger from "./logger.js";

const logger = getLogger().getLogger("server/utils/getApis");
const apisBasePath = "./apis";
const isWin = os.type() === "Windows_NT";

async function getApiPath(apiContext: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        logger.debug("getApiFiles apiContext: ", apiContext);
        const files: string[] = [];
        const walk = klaw(apiContext, {
            depthLimit: -1,
        });
        walk.on("data", file => {
            const isFile = file.stats.isFile();
            const isDir = file.stats.isDirectory();
            const src = file.path;
            logger.debug('klaw src: ', src);
            logger.debug('klaw isFile: ', isFile, " ; isDir: ", isDir);
            if (isFile && /\.js$/i.test(src)) {
                files.push(src); // .replace(apiContext, "").replace(".js", ""));
            }
            // else if (isDir && src.replace(apiContext, "")) {
            //     files = files.concat(await getApiFiles(state.path));
            // }
        });
        walk.on("end", () => {
            logger.debug("klaw files: ", files);
            resolve(files);
        });
        walk.on("error", error => {
            logger.error("klaw err: ", error, files);
            resolve(files);
        });
    });
}

export default async function (): Promise<IDynamicRoute | null> {
    const apiContext = path.resolve(apisBasePath);
    if (!fs.existsSync(apiContext)) {
        return null;
    }
    const files = await getApiPath(apiContext);
    // files.forEach(name => {
    //     console.debug(require(/* webpackIgnore: true */`./apis${name}.js`));
    // });
    if (files && files.length) {
        const apis = {};
        for (let i = 0, len = files.length; i < len; i++) {
            const file = files[i];
            const url = file.replace(apiContext, "").replace(".js", "").replace(/\\+/g, '/').replace(/(\/?)\(([^)]+?)\)/g, '$1:$2');
            logger.debug("api file uri: ", file);
            logger.debug("api url: ", url);
            if (!fs.existsSync(file)) {
                logger.error('api file not exist: ', file);
                continue;
            }
            try {
                const instance = await import(/* webpackIgnore: true */"./" + path.relative(path.resolve("."), file).replace(/\\+/g, "/"));
                const methods = Object.keys(instance).filter(k => {
                    const fn = instance[k];
                    return isFunction(fn) || isFunction(fn.default);
                });
                logger.debug('api methods: ', methods);
                methods.forEach(method => {
                    // 先处理几种特殊导出方法： get\post\put\delete\default
                    if (!apis[url]) {
                        apis[url] = {};
                    }
                    if (/^(?:GET|POST|DELETE|PUT)$/gi.test(method)) {
                        apis[url][method] = instance[method];
                    } else if ("default" === method) {
                        apis[url]["all"] = isFunction(instance[method]) ? instance[method] : instance[method].default;
                    } else {
                        const childPath = `${url}/${method}`;
                        if (!apis[childPath]) {
                            apis[childPath] = {};
                        }
                        apis[childPath]["all"] = instance[method];
                    }
                });
            } catch (e) {
                logger.error(e);
            }
        }
        return apis;
    }
    return null;
}