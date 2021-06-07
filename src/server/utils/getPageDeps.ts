import fs from "fs-extra";
import Path from "path";
import getAssetsURI from "./getAssetsURI";
import getLogger from "./getLogger";

const logger = getLogger().getLogger("server/utils/getAssetsRUI");

let pageDeps: any;
const filePath = Path.resolve("./pageAssetsDeps.json");

if (fs.existsSync(filePath)) {
    pageDeps = fs.readJSONSync(filePath);
}

export async function getPageCSSDeps (pageIdentifier): Promise<string[]> {
    if (pageDeps === undefined) {
        return [];
    }
    return new Promise((resolve, reject) => {
        const deps = pageDeps[pageIdentifier];
        logger.debug("pageIdentifier: ", pageIdentifier, " depends: ", deps);
        let depsPath = [];
        if (deps && deps.length) {
            deps.forEach(k => {
                const assets = getAssetsURI(new RegExp(k + "_.{8}\\.css$"));
                if (assets) {
                    depsPath = depsPath.concat(assets);
                }
            });
        }
        logger.debug("depsPath: ", depsPath);
        resolve(depsPath);
    });
}