function handleServerBaseJS(assetsConfigMainfestJson) {
    const splitChunksArr = [];
    splitChunksArr.push(assetsConfigMainfestJson["runtime.js"]);
    // delete assetsConfigMainfestJson["runtime.js"];
    if (assetsConfigMainfestJson["lib.js"]) {
        splitChunksArr.push(assetsConfigMainfestJson["lib.js"]);
        // delete assetsConfigMainfestJson["lib.js"];
    }
    splitChunksArr.push(assetsConfigMainfestJson["nmdeps.js"]);
    // delete assetsConfigMainfestJson["nmdeps.js"];
    if (assetsConfigMainfestJson["common.js"]) {
        splitChunksArr.push(assetsConfigMainfestJson["common.js"]);
        // delete assetsConfigMainfestJson["common.js"];
    }
    // if (assetsConfigMainfestJson["index.js"]) {
    //     splitChunksArr.push(assetsConfigMainfestJson["index.js"]);
    //     // delete assetsConfigMainfestJson["index.css"];
    // }
    return splitChunksArr;
}

function handleServerBaseCSS(assetsConfigMainfestJson) {
    const splitChunksArr = [];
    // for (let key in assetsConfigMainfestJson) {
    //     if (/^styleEntry\/.+\.css$/.test(key)) {
    //         splitChunksArr.push(assetsConfigMainfestJson[key]);
    //         delete assetsConfigMainfestJson[key];
    //     }
    // }
    if (assetsConfigMainfestJson["common.css"]) {
        splitChunksArr.push(assetsConfigMainfestJson["common.css"]);
        // delete assetsConfigMainfestJson["common.css"];
    }
    // if (assetsConfigMainfestJson["index.css"]) {
    //     splitChunksArr.push(assetsConfigMainfestJson["index.css"]);
    //     // delete assetsConfigMainfestJson["index.css"];
    // }
    return splitChunksArr;
}

export default function(assetsConfigMainfestJson) {
    return {
        styles: handleServerBaseCSS(assetsConfigMainfestJson),
        scripts: handleServerBaseJS(assetsConfigMainfestJson),
    }
}