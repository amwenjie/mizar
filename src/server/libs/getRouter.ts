import { IGetMetaFn, IMetaProps } from "../../interface";
import getLogger from "./../utils/logger";
import { getPublicPath } from "../utils/getConfig";
import handleMeta from "./handleMeta";
import PageRouter from "./router/pageRouter";
import ApiRouter from "./router/apiRouter";
import getApis from "../utils/getApis"

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
        const pathArr = Object.keys(apis);
        if (pathArr.length) {
            return new ApiRouter(apis);
        }
    }
    return null;
}