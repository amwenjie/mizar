import fs from "fs-extra";
import Path from "path";
import getLogger from "./getLogger";

const logger = getLogger().getLogger("server/utils/getAssetsRUI");
let assetsMap: object;

export default function(name?: string | string[]): string | string[] | object {
    if (!assetsMap) {
        assetsMap = fs.readJSONSync(Path.resolve("./assetsMainfest.json"));
    }
    logger.debug("name: ", name, assetsMap);
    
    if (name) {
        if (typeof name === "string") {
            return assetsMap[name];
        } else if (name instanceof Array) {
            return name.map(n => assetsMap[n]);
        }
    }
    return {
        ...assetsMap,
    };
}

export function getPageCssAssets(): string[] {
    if (!assetsMap) {
        assetsMap = fs.readJSONSync(Path.resolve("./assetsMainfest.json"));
    }
    const cssAssets = [];
    for (let key in assetsMap) {
        if (/^page\/.+\.css$/.test(key)) {
            cssAssets.push(assetsMap[key]);
        }
    }
    return cssAssets;
}

export function getPageJSAssets(): string[] {
    if (!assetsMap) {
        assetsMap = fs.readJSONSync(Path.resolve("./assetsMainfest.json"));
    }
    const jsAssets = [];
    for (let key in assetsMap) {
        if (/^page\/.+\.js$/.test(key)) {
            jsAssets.push(assetsMap[key]);
        }
    }
    return jsAssets;
}

export function getPageAssets(): string[] {
    return getPageCssAssets().concat(getPageJSAssets());
}