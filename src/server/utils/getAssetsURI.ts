import * as fs from "fs-extra";
import * as Path from "path";
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
    return Object.assign({}, assetsMap);
}

export function getPageAssets(): string[] {
    if (!assetsMap) {
        assetsMap = fs.readJSONSync(Path.resolve("./assetsMainfest.json"));
    }
    const pageAssets = [];
    for (let key in assetsMap) {
        if (/^page\//.test(key)) {
            pageAssets.push(assetsMap[key]);
        }
    }
    return pageAssets;
}