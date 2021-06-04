import fs from "fs-extra";
import appState from "../../iso/libs/state";
import { ICustomConfig } from "../../interface";
const packageJSON = fs.readJSONSync("./package.json");
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
    return getCustomConf().port;
}

export function getCDN(): string {
    return getCustomConf().cdn; //  || '/';
}

export function getCustomConf(): ICustomConfig {
    return packageJSON.appConfig;
}

export function getAssetsPathPrefix(): string {
    let prefix = getCustomConf().assetsPathPrefix;
    if (prefix && !prefix.endsWith("/")) {
        prefix += "/";
    }
    return prefix || '';
}

export function getPackageName(): string {
    return packageJSON.name || '';
}