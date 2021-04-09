import * as fs from "fs-extra";
import state from "../../iso/libs/state";
import { ICustomConfig } from "../interface";
const packageJSON = fs.readJSONSync("./package.json");
let publicPath = "";

export function getPublicPath(): string {
    if (publicPath === "") {
        const cdn = state.isDebug ? '/' : getCDN();
        const assetPath = getAssetsPathPrefix();
        if (assetPath) {
            publicPath = `${cdn}${getAssetsPathPrefix()}/${getPackageName()}/client/`;
        } else {
            publicPath = `${cdn}${getPackageName()}/client/`;
        }
    }
    return publicPath;
}

export function getPort(): number {
    return getCustomConf().port;
}

export function getCDN(): string {
    return packageJSON.cdn || '/';
}

export function getCustomConf(): ICustomConfig {
    return packageJSON.customConfig;
}

export function getAssetsPathPrefix(): string {
    return getCustomConf().assetsPathPrefix || '';
}

export function getPackageName(): string {
    return packageJSON.name || '';
}