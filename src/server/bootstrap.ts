import getLogger from "./utils/getLogger";
// import { getLogger } from "../iso/utils/getLogger";
import WebServer from "./index";
import { getApiRouter, getPageRouter } from "./libs/getRouter";
import { IProxyConfig, IPageRouter } from "../interface";
// import { getPublicPath } from "./utils/getConfig";

// declare let __webpack_public_path__: string;

const logger = getLogger().getLogger("server/boostrap");
// const logger = getLogger("server/boostrap")

export function bootstrap(server: WebServer = new WebServer()) {
    return async function (pageRouter: IPageRouter[], getMeta, config?: IProxyConfig) {
        try {
            // __webpack_public_path__ = getPublicPath();

            const apiRouter = await getApiRouter();
            if (apiRouter) {
                server.useRouter(apiRouter.getRouter());
            }
            
            const pr = await getPageRouter(pageRouter, getMeta);
            server.useRouter(pr.getRouter());

            await server.bootstrapAsync();
        } catch (e) {
            logger.error("启动错误", e);
        }
    };
}
