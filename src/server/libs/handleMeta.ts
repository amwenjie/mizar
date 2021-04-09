import * as fs from "fs-extra";
import * as Path from "path";

export default function handleMeta(getMeta, publicPath) {
    let finalMeta = { favicon: "", styles: [], scripts: [], metas: [], links: [] };
    let meta;
    if (Object.prototype.toString.call(getMeta) === "[object Function]") {
        meta = getMeta();
    } else {
        meta = getMeta;
    }
    finalMeta = Object.assign({}, meta);
    const assetsConfigMainfestJson = fs.readJSONSync(Path.resolve("./assetsConfigMainfest.json"));
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
        if (/^src\/public\//i.test(key)) {
            continue;
        }
        if (/\.css$|\.css\.map$/.test(key)) {
            finalMeta.styles.push(assetsConfigMainfestJson[key]);
        } else if (/\.js$|\.js\.map$/.test(key)) {
            finalMeta.scripts.push(assetsConfigMainfestJson[key]);
        }
    }
    console.info("finalMeta: ", finalMeta);
    return finalMeta;
}

function handleRelativePath(publicPath) {
    return (path, assetsCategory = "") => {
        if (!path.startsWith("http://") && !path.startsWith("https")) {
            // 是个相对路径
            if (assetsCategory !== "" && !assetsCategory.endsWith("/")) {
                assetsCategory = assetsCategory + "/";
            }
            return `${publicPath}${assetsCategory}${path}`;
        }
        return path;
    };
}
