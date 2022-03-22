import { IGetMetaFn, IMetaProps } from "../../interface.js";
import getLogger from "../utils/logger.js";
import checkPositivePath from "../utils/checkPositivePath.js";

const logger = getLogger().getLogger("server/libs/handleMeta");

export default function handleMeta(publicPath, getMeta: IGetMetaFn | IMetaProps = {}): IMetaProps {
    let meta;
    if (typeof getMeta === "function") {
        meta = getMeta();
    } else {
        meta = getMeta;
    }
    const finalMeta = {
        favicon: "",
        styles: [],
        scripts: [],
        metas: [],
        links: [],
        ...meta,
    };

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