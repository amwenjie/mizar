import state from "../iso/libs/state";
import { getPublicPath } from "./util/getConfig";
import handleMeta from "./libs/handleMeta";
import PageRouter from "./libs/router/pageRouter";

export async function getAsyncRouter(pageRouter, getMeta, proxyConfig?): Promise<any> {
    if (!proxyConfig) {
        console.info("proxyConfig未传入，说明没有http代理业务");
    }

    const publicPath = getPublicPath();
    const parsedMeta: any = Object.assign({}, handleMeta(getMeta, publicPath));
    state.apis = parsedMeta.apis;
    return new PageRouter(pageRouter, parsedMeta, proxyConfig);
}