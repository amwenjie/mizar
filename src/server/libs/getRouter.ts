import getLogger from "./../utils/getLogger";
// import { getLogger } from "../iso/utils/getLogger";
import { getPublicPath } from "../utils/getConfig";
import handleMeta from "./handleMeta";
import PageRouter from "./router/pageRouter";
import ApiRouter from "./router/apiRouter";
import getApis from "../utils/getApis"
const logger = getLogger().getLogger("server/getRouter");
// const logger = getLogger("server/getRouter")

export function getPageRouter(pageRouter, getMeta): any {
    const publicPath = getPublicPath();
    const parsedMeta: any = Object.assign({}, handleMeta(getMeta, publicPath));
    return new PageRouter(pageRouter, parsedMeta);
}

export async function getApiRouter() {
    const apis = await getApis();
    logger.debug("apis: ", apis);
    if (apis) {
        const pathArr = Object.keys(apis);
        if (pathArr.length) {
            return new ApiRouter(apis);
        }
    }
    return null;
}