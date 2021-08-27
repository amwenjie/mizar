import fs from "fs-extra";
import Path from "path";
import klaw from "klaw";
import getLogger from "./getLogger";

const logger = getLogger().getLogger("server/utils/getApis");

async function getApiPath(entry): Promise<string[]> {
    return new Promise((resolve, reject) => {
        logger.debug("getApiFiles entry: ", entry);
        let files: string[] = [];
        const walk = klaw(entry, {
            depthLimit: -1,
        });
        walk.on("data", async (state) => {
            const isFile = state.stats.isFile();
            const isDir = state.stats.isDirectory();
            const src = state.path;
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
    const apiFilePath = Path.resolve('./apis');
    let files = await getApiPath(apiFilePath);
    // files.forEach(name => {
    //     console.debug(require(/* webpackIgnore: true */`./apis${name}.js`));
    // });
    if (files && files.length) {
        let apis = {};
        files.forEach(url => {
            const file = `./apis${url}.js`;
            logger.debug("file: ", file);
            if (!fs.existsSync(file)) {
                logger.error('file not exist: ', file);
                return;
            }
            try {
                const instance = require(/* webpackIgnore: true */ file);
                logger.debug('api url: ', url);
                const methods = Object.keys(instance).filter(k => typeof instance[k] === "function");
                logger.debug('api methods: ', methods);
                methods.forEach(method => {
                    // 先处理几种特殊导出方法： get\post\put\delete\default
                    if (!apis[url]) {
                        apis[url] = {};
                    }
                    if (/^get$|^post$|^delete$|^put$/gi.test(method)) {
                        apis[url][method] = instance[method];
                    } else if ("default" === method) {
                        apis[url]["all"] = instance[method];
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
        });
        return apis;
    }
    return null;
}