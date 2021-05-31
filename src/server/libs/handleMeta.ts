import * as fs from "fs-extra";
import * as Path from "path";
import getLogger from "../utils/getLogger";
// import { getLogger } from "../../iso/utils/getLogger";
import checkPositivePath from "../utils/checkPositivePath";

// const logger = getLogger("server/libs/handleMeta");
const logger = getLogger().getLogger("server/libs/handleMeta");

export default function handleMeta(getMeta, publicPath) {
    let finalMeta = { favicon: "", styles: [], scripts: [], metas: [], links: [] };
    let meta;
    if (Object.prototype.toString.call(getMeta) === "[object Function]") {
        meta = getMeta();
    } else {
        meta = getMeta;
    }
    finalMeta = Object.assign({}, meta);
    const assetsConfigMainfestJson = fs.readJSONSync(Path.resolve("./assetsMainfest.json"));
    logger.debug(assetsConfigMainfestJson);
    const getFinalPath = handleRelativePath(publicPath);
    finalMeta.favicon = getFinalPath(finalMeta.favicon || "favicon.ico");
    if (finalMeta.styles) {
        finalMeta.styles = finalMeta.styles.map((style) => {
            return getFinalPath(style);
        });
    }
    if (finalMeta.scripts) {
        finalMeta.scripts = finalMeta.scripts.map((script) => {
            return getFinalPath(script);
        });
    }
    if (finalMeta.links) {
        finalMeta.links = finalMeta.links.map((link) => {
            if (link.props.href) {
                link.props.href = getFinalPath(link.props.href);
                return link;
            }
            return link;
        });
    }
    if (!finalMeta.styles) {
        finalMeta.styles = [];
    }
    if (!finalMeta.scripts) {
        finalMeta.scripts = [];
    }
    
    finalMeta.styles = finalMeta.styles.concat(
        handleBaseCSS(assetsConfigMainfestJson),
        // handleDebugMapAsset(assetsConfigMainfestJson)
    );
    finalMeta.scripts = finalMeta.scripts.concat(
        handleBaseJS(assetsConfigMainfestJson),
        // handleDebugMapAsset(assetsConfigMainfestJson)
    );

    for (let key in assetsConfigMainfestJson) {
        if (/^public\//i.test(key) || /^styleEntry\/.+\.js$/.test(key)) {
            continue;
        }
        if (/\.css$/.test(key) && !finalMeta.styles.includes(assetsConfigMainfestJson[key])) {
            finalMeta.styles.push(assetsConfigMainfestJson[key]);
        } else if (/\.js$/.test(key) && !finalMeta.scripts.includes(assetsConfigMainfestJson[key])) {
            finalMeta.scripts.push(assetsConfigMainfestJson[key]);
        }
    }
    logger.info("finalMeta: ", finalMeta);
    return finalMeta;
}

function handleRelativePath(publicPath) {
    return (path, assetsCategory = "") => {
        if (!checkPositivePath(path)) {
            // 是个相对路径
            return `${publicPath}${path}`;
        }
        return path;
    };
}

function handleBaseJS(assetsConfigMainfestJson) {
    const splitChunksArr = [];
    splitChunksArr.push(assetsConfigMainfestJson["runtime.js"]);
    delete assetsConfigMainfestJson["runtime.js"];
    splitChunksArr.push(assetsConfigMainfestJson["lib.js"]);
    delete assetsConfigMainfestJson["lib.js"];
    splitChunksArr.push(assetsConfigMainfestJson["vendor.js"]);
    delete assetsConfigMainfestJson["vendor.js"];
    if (assetsConfigMainfestJson["common.js"]) {
        splitChunksArr.push(assetsConfigMainfestJson["common.js"]);
        delete assetsConfigMainfestJson["common.js"];
    }
    return splitChunksArr;
}

function handleBaseCSS(assetsConfigMainfestJson) {
    const splitChunksArr = [];
    for (let key in assetsConfigMainfestJson) {
        if (/^styleEntry\/.+\.css$/.test(key)) {
            splitChunksArr.push(assetsConfigMainfestJson[key]);
            delete assetsConfigMainfestJson[key];
        }
    }
    if (assetsConfigMainfestJson["common.css"]) {
        splitChunksArr.push(assetsConfigMainfestJson["common.css"]);
        delete assetsConfigMainfestJson["common.css"];
    }
    return splitChunksArr;
}