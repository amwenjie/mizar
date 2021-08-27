import fs from "fs-extra";
import Path from "path";
import getLogger from "./getLogger";

const filePath = Path.resolve("./assetsMainfest.json");
const logger = getLogger().getLogger("server/utils/getAssetsURI");
let assetsMap: object;

if (fs.existsSync(filePath)) {
    assetsMap = fs.readJSONSync(filePath);
}

export default function(name?: string | string[] | RegExp): string | string[] | object | null {
    logger.debug("name: ", name, assetsMap);

    if (assetsMap === undefined) {
        if (typeof name === "string") {
            return "";
        } else if (name instanceof Array || name instanceof RegExp) {
            return [];
        }
        return null;
    }
    
    if (name) {
        if (typeof name === "string") {
            return assetsMap[name];
        } else if (name instanceof Array) {
            return name.map(n => assetsMap[n]);
        } else if (name instanceof RegExp) {
            const map = [];
            Object.keys(assetsMap).forEach(k => {
                if (name.test(k)) {
                    map.push(assetsMap[k]);
                }
            });
            return map;
        }
    }
    return {
        ...assetsMap,
    };
}

export function getPageCssAssets(): string[] {
    if (assetsMap === undefined) {
        return [];
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
    if (assetsMap === undefined) {
        return [];
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