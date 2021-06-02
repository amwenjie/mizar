import * as fs from "fs-extra";
import * as Path from "path";
import getLogger from "../utils/getLogger";
// import { getLogger } from "../../iso/utils/getLogger";
import checkPositivePath from "../utils/checkPositivePath";
import getAssetsURI from "../utils/getAssetsURI";
import getBaseAssets from "../utils/getBaseAssets";

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
    const assetsConfigMainfestJson = getAssetsURI() as object;
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
    const { styles: cstyle, scripts: cscript } = getBaseAssets(assetsConfigMainfestJson);
    finalMeta.styles = finalMeta.styles.concat(cstyle);
    finalMeta.scripts = finalMeta.scripts.concat(cscript);

    for (let key in assetsConfigMainfestJson) {
        if (/^public\//i.test(key) || /^styleEntry\/.+\.js$/.test(key) || /^page\/.+/.test(key)) {
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