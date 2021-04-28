import state from "../iso/libs/state";
import { getLogger } from "../iso/libs/utils/getLogger";
import WebServer from "./index";
import { getAsyncRouter } from "./getRouter";
import { IProxyConfig } from "./interface";
import { getPublicPath } from "./util/getConfig";
import isDebug from "./util/isDebug";

declare let __webpack_public_path__: string;
const logger = getLogger("server/boostrap")

export function bootstrap(server: WebServer = new WebServer()) {
    return async function (pageRouter, getMeta, config?: IProxyConfig) {
        try {
            state.isDebug = isDebug;
            __webpack_public_path__ = getPublicPath();

            server.setStatic(__webpack_public_path__);

            await server.setRouter(await getAsyncRouter(pageRouter, getMeta, config)).bootstrapAsync();
        } catch (e) {
            logger.error("启动错误", e);
        }
    };
}
