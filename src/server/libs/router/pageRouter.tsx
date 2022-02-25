import Express from "express";
import { matchRoutes } from "react-router-dom";
import getPathForRouterMatch from "../../utils/getPathForRouterMatch";
import getLogger from "../../utils/logger";
import { getErrorPageRenderString, getResponsePage } from "../pageRender";
import state from "../state";
import Router from "./index";

const logger = getLogger().getLogger("server/libs/router/pageRouter");

export default class PageRouter extends Router {
    private pageRouter;
    
    protected router: Express.Router = Express.Router();

    public constructor(pageRouter, meta) {
        super();
        state.meta = meta;
        this.pageRouter = pageRouter;
    }

    public setRouter() {
        this.router.use(async (req: Express.Request, res: Express.Response, next) => {
            res.setHeader("Content-Type", "text/html; charset=UTF-8");
            res.write("<!DOCTYPE html>");
            res.on('finish', () => {
                logger.info("响应完成.");
            });
            try {
                const originalUrl: string = req.originalUrl;
                const path: string = getPathForRouterMatch(originalUrl);
                const matchedRoute = matchRoutes(this.pageRouter, path);
                
                logger.info("originalUrl: ", originalUrl);
                logger.info("path: ", path);
                logger.info("matchedRoute: ", matchedRoute);

                if (!matchedRoute) {
                    logger.warn(`not match any router branch. originalUrl: ${originalUrl}, path: ${path}`);
                    // 找不到匹配的页面，由业务自己处理
                    return next();
                }
                logger.info("match router branch.");
                const htmlString: string = await getResponsePage(req, this.pageRouter, matchedRoute[matchedRoute.length - 1]);;
                logger.info("渲染完成，准备响应页面给客户端");
                res.end(htmlString, "utf8");
            } catch (err) {
                res.end(getErrorPageRenderString(), "utf-8");
                logger.error("服务端路由处理时出现异常: ", err.message, " ; stack: ", err.stack);
            }
        });
    }
}
