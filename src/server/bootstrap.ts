import state from "../iso/libs/state";
import getLogger from "./utils/getLogger";
// import { getLogger } from "../iso/libs/utils/getLogger";
import WebServer from "./index";
import { getAsyncRouter } from "./getRouter";
import { IProxyConfig } from "./interface";
import { getPublicPath } from "./utils/getConfig";
import isDebug from "./utils/isDebug";

declare let __webpack_public_path__: string;

const logger = getLogger().getLogger("server/boostrap");
// const logger = getLogger("server/boostrap")

export function bootstrap(server: WebServer = new WebServer()) {
    return async function (pageRouter, getMeta, config?: IProxyConfig) {
        try {
            state.isDebug = isDebug;
            __webpack_public_path__ = getPublicPath();

            const pr = await getAsyncRouter(pageRouter, getMeta, config);
            await server.useRouter(pr.getRouter()).bootstrapAsync();
        } catch (e) {
            logger.error("启动错误", e);
        }
    };
}
