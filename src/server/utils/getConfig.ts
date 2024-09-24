import fs from "fs-extra";
import { IAppConf } from "../../interface.js";
import getLogger from "./logger.js";

let publicPath = "";
declare const IS_DEBUG_MODE;

const logger = getLogger();
const log = logger.getLogger("server/utils/getConfig");
let appConfJSON = null;

export function getPublicPath(): string {
    if (publicPath === "") {
        const cdn = IS_DEBUG_MODE ? '/' : getCDN();
        publicPath = `${cdn}${getAssetsPathPrefix()}client/`; // ${getPackageName()}/client/`;
    }
    return publicPath;
}

export function getPort(): number {
    return getAppConf().port || 8889;
}

export function getCDN(): string {
    return getAppConf().cdn || ""; //  || '/';
}

export function getAppConf(): IAppConf {
    if (!appConfJSON) {
        try {
            appConfJSON = fs.readJSONSync("./config/app.json");
        } catch (e) {
            log.error(e);
            appConfJSON = {};
        }
    }
    return appConfJSON;
}

export function getAssetsPathPrefix(): string {
    let prefix = getAppConf().assetsPathPrefix;
    if (prefix && !prefix.endsWith("/")) {
        prefix += "/";
    }
    return prefix || '';
}

export function getPackageName(): string {
    return getAppConf.name || '';
}