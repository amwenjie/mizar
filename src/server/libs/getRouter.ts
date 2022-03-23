import { IGetMetaFn, IMetaProps } from "../../interface.js";
import getLogger from "./../utils/logger.js";
import { getPublicPath } from "../utils/getConfig.js";
import handleMeta from "./handleMeta.js";
import PageRouter from "./router/pageRouter.js";
import ApiRouter from "./router/apiRouter.js";
import getApis from "../utils/getApis.js"
import state from "./state.js";

const logger = getLogger().getLogger("server/getRouter");

export function getPageRouter(pageRouter, getMeta?: IGetMetaFn | IMetaProps): any {
    const publicPath = getPublicPath();
    const parsedMeta: any = {
        ...handleMeta(publicPath, getMeta),
    };
    return new PageRouter(pageRouter, parsedMeta);
}

export async function getApiRouter() {
    const apis = await getApis();
    logger.debug("apis: ", apis);
    if (apis) {
        state.apis = apis;
        const pathArr = Object.keys(apis);
        if (pathArr.length) {
            return new ApiRouter();
        }
    }
    return null;
}