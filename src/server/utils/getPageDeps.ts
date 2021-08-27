import fs from "fs-extra";
import Path from "path";
import getAssetsURI from "./getAssetsURI";
import getLogger from "./getLogger";

const logger = getLogger().getLogger("server/utils/getPageDeps");

let pageDeps: any;
const filePath = Path.resolve("./pageAssetsDeps.json");

if (fs.existsSync(filePath)) {
    pageDeps = fs.readJSONSync(filePath);
}

export const pageDepType = {
    css: "css",
    js: "js",
};

function getPageDepsByType(pageIdentifier: string, type: string): string[] {
    if (pageDeps === undefined) {
        return [];
    }
    const deps = pageDeps[pageIdentifier];
    logger.debug("pageIdentifier: ", pageIdentifier, " depends: ", deps);
    let depsPath = [];
    if (deps && deps.length) {
        deps.forEach(k => {
            const assets = getAssetsURI(new RegExp(k + `(?:_.{8})?\\.${type}$`));
            if (assets) {
                depsPath = depsPath.concat(assets);
            }
        });
    }
    logger.debug("depsPath: ", depsPath);
    return depsPath;
}

export function getPageCSSDeps(pageIdentifier): string[] {
    return getPageDepsByType(pageIdentifier, pageDepType.css);
}


export function getPageJSDeps(pageIdentifier): string[] {
    return getPageDepsByType(pageIdentifier, pageDepType.js);
}