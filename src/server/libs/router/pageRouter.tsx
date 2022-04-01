import Express from "express";
import { matchRoutes } from "react-router-dom";
import { type IMetaProps, type IPageRouter } from "../../../interface.js";
import getPathForRouterMatch from "../../utils/getPathForRouterMatch.js";
import getLogger from "../../utils/logger.js";
import { getErrorPageRenderString, getResponsePage } from "../pageRender.js";
import state from "../state.js";
import Router from "./index.js";

const logger = getLogger().getLogger("server/libs/router/pageRouter");

class PageRouter extends Router {
    private pageRouter: IPageRouter[];
    
    protected router: Express.Router = Express.Router();

    public constructor(pageRouter: IPageRouter[], meta: IMetaProps) {
        super();
        state.meta = meta;
        this.pageRouter = pageRouter;
    }

    public setRouter() {
        this.router.use(async (req: Express.Request, res: Express.Response) => {
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
                    res.status(404).end();
                    return;
                }
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.write("<!DOCTYPE html>");
                logger.info("match router branch.");
                const htmlString: string = await getResponsePage(req, res, this.pageRouter, matchedRoute[matchedRoute.length - 1]);
                logger.info("渲染完成，准备响应页面给客户端");
                res.end(htmlString, "utf-8");
            } catch (err) {
                res.end(getErrorPageRenderString(), "utf-8");
                logger.error("服务端路由处理时出现异常: ", err.message, " ; stack: ", err.stack);
            }
        });
    }
}

export default PageRouter;
