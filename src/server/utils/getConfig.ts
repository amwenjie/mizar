import fs from "fs-extra";
import { IAppConf } from "../../interface.js";
const appConfJSON = fs.readJSONSync("./config/app.json");
let publicPath = "";
declare const IS_DEBUG_MODE;
export function getPublicPath(): string {
    if (publicPath === "") {
        const cdn = IS_DEBUG_MODE ? '/' : getCDN();
        publicPath = `${cdn}${getAssetsPathPrefix()}client/`; // ${getPackageName()}/client/`;
    }
    return publicPath;
}

export function getPort(): number {
    return getAppConf().port;
}

export function getCDN(): string {
    return getAppConf().cdn || ""; //  || '/';
}

export function getAppConf(): IAppConf {
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