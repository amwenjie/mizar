import fs from "fs-extra";
import path from "path";
import klaw from "klaw";
import isFunction from "../../iso/utils/isFunction.js";
import getLogger from "./logger.js";

const logger = getLogger().getLogger("server/utils/getApis");
const apisBasePath = "./apis";

async function getApiPath(entry): Promise<string[]> {
    return new Promise((resolve, reject) => {
        logger.debug("getApiFiles entry: ", entry);
        let files: string[] = [];
        const walk = klaw(entry, {
            depthLimit: -1,
        });
        walk.on("data", file => {
            const isFile = file.stats.isFile();
            const isDir = file.stats.isDirectory();
            const src = file.path;
            logger.debug('klaw src: ', src);
            logger.debug('klaw isFile: ', isFile, " ; isDir: ", isDir);
            if (isFile && /\.js$/i.test(src)) {
                files.push(src.replace(`${entry}`, "").replace(".js", ""));
            }
            // else if (isDir && src.replace(entry, "")) {
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

export default async function () {
    const apiPath = path.resolve(apisBasePath);
    if (!fs.existsSync(apiPath)) {
        return null;
    }
    let files = await getApiPath(apiPath);
    // files.forEach(name => {
    //     console.debug(require(/* webpackIgnore: true */`./apis${name}.js`));
    // });
    if (files && files.length) {
        let apis = {};
        for (let i = 0, len = files.length; i < len; i++) {
            const url = files[i];
            const file = `${apisBasePath}${url}.js`;
            logger.debug("api file uri: ", file);
            if (!fs.existsSync(file)) {
                logger.error('api file not exist: ', file);
                continue;
            }
            try {
                const instance = await import(/* webpackIgnore: true */ file);
                logger.debug('api url: ', url);
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