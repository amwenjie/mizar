import state from "../iso/libs/state";
import getLogger from "./utils/getLogger";
// import { getLogger } from "../iso/utils/getLogger";
import { getPublicPath } from "./utils/getConfig";
import handleMeta from "./libs/handleMeta";
import PageRouter from "./libs/router/pageRouter";
const logger = getLogger().getLogger("server/getRouter");
// const logger = getLogger("server/getRouter")

export async function getAsyncRouter(pageRouter, getMeta, proxyConfig?): Promise<any> {
    if (!proxyConfig) {
        logger.info("proxyConfig未传入，说明没有http代理业务");
    }

    const publicPath = getPublicPath();
    const parsedMeta: any = Object.assign({}, handleMeta(getMeta, publicPath));
    state.apis = parsedMeta.apis;
    return new PageRouter(pageRouter, parsedMeta, proxyConfig);
}