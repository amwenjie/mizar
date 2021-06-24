import getLogger from "../utils/getLogger";
import checkPositivePath from "../utils/checkPositivePath";
import getAssetsURI from "../utils/getAssetsURI";
import getBaseAssets from "../utils/getBaseAssets";

const logger = getLogger().getLogger("server/libs/handleMeta");

export default function handleMeta(getMeta, publicPath) {
    let finalMeta = { favicon: "", styles: [], scripts: [], metas: [], links: [] };
    let meta;
    if (Object.prototype.toString.call(getMeta) === "[object Function]") {
        meta = getMeta();
    } else {
        meta = getMeta;
    }
    finalMeta = {...meta};
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
    
    const assetsConfigMainfestJson = getAssetsURI() as object;
    logger.debug("assetsConfigMainfestJson: ", assetsConfigMainfestJson);

    if (assetsConfigMainfestJson) {
        const { styles: cstyle, scripts: cscript } = getBaseAssets(assetsConfigMainfestJson);
        finalMeta.styles = finalMeta.styles.concat(cstyle);
        finalMeta.scripts = finalMeta.scripts.concat(cscript);

        // for (let key in assetsConfigMainfestJson) {
        //     if (key.startsWith("public/")
        //         || key.startsWith("styleEntry/")
        //         || key.startsWith("page/")
        //         || key === "index.js"
        //     ) {
        //         continue;
        //     }
        //     if (/\.css$/.test(key) && !finalMeta.styles.includes(assetsConfigMainfestJson[key])) {
        //         finalMeta.styles.push(assetsConfigMainfestJson[key]);
        //     } else if (/\.js$/.test(key) && !finalMeta.scripts.includes(assetsConfigMainfestJson[key])) {
        //         finalMeta.scripts.push(assetsConfigMainfestJson[key]);
        //     }
        // }
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