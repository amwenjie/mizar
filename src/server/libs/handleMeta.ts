import * as fs from "fs-extra";
import * as Path from "path";
import { getLogger } from "../../iso/libs/utils/getLogger";
import checkPositivePath from "../utils/checkPositivePath";

const logger = getLogger("server/libs/handleMeta");

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
    finalMeta.scripts.push(assetsConfigMainfestJson["runtime.js"]);
    delete assetsConfigMainfestJson["runtime.js"];
    assetsConfigMainfestJson["runtime.js.map"] && finalMeta.scripts.push(assetsConfigMainfestJson["runtime.js.map"]);
    delete assetsConfigMainfestJson["runtime.js.map"];
    finalMeta.scripts.push(assetsConfigMainfestJson["vendor.js"]);
    delete assetsConfigMainfestJson["vendor.js"];
    assetsConfigMainfestJson["vendor.js.map"] && finalMeta.scripts.push(assetsConfigMainfestJson["vendor.js.map"]);
    delete assetsConfigMainfestJson["vendor.js.map"];
    for (let key in assetsConfigMainfestJson) {
        if (/^public\//i.test(key)) {
            continue;
        }
        if (/\.css$|\.css\.map$/.test(key) && !finalMeta.styles.includes(assetsConfigMainfestJson[key])) {
            finalMeta.styles.push(assetsConfigMainfestJson[key]);
        } else if (/\.js$|\.js\.map$/.test(key) && !finalMeta.scripts.includes(assetsConfigMainfestJson[key])) {
            finalMeta.scripts.push(assetsConfigMainfestJson[key]);
        }
    }
    logger.log("finalMeta: ", finalMeta);
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
