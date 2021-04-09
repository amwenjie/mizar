import WebServer from "./index";
import state from "../iso/libs/state";
import { getPublicPath } from "./util/getConfig";
import { getAsyncRouter } from "./getRouter";
import { IProxyConfig } from "./interface";
import isDebug from "./util/isDebug";

declare let __webpack_public_path__: string;

export function bootstrap(server: WebServer = new WebServer()) {
    return async function (pageRouter, getMeta, config?: IProxyConfig) {
        try {
            state.isDebug = isDebug;
            __webpack_public_path__ = getPublicPath();

            server.setStatic(__webpack_public_path__);

            await server.setRouter(await getAsyncRouter(pageRouter, getMeta, config)).bootstrapAsync();
        } catch (e) {
            console.error("启动错误", e);
        }
    };
}
