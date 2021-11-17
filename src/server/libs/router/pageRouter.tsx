import Express from "express";
import { ReactElement } from "react";
import { matchRoutes } from "react-router-config";
import getLogger from "../../utils/logger";
import { getComRenderString, getErrorPageRenderString, getPage } from "../comController";
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
        this.router.use(async (req, res, next) => {
            res.setHeader("Content-Type", "text/html; charset=UTF-8");
            res.write("<!DOCTYPE html>");
            res.on('finish', () => {
                logger.info("响应完成.");
            });
            try {
                const originalUrl: string = req.originalUrl;
                const path: string = this.getUrlPath(originalUrl);
                const branch = matchRoutes(this.pageRouter, path);
                
                logger.info("originalUrl: ", originalUrl);
                logger.info("path: ", path);
                logger.info("branch: ", branch);

                if (!branch[0]) {
                    logger.warn(`not match any router branch. originalUrl: ${originalUrl}, path: ${path}`);
                    // 找不到匹配的页面，由express的404兜底
                    return next();
                }
                logger.info("match router branch.");
                const Page: ReactElement = await getPage(req, branch[0]);
                const htmlString: string = getComRenderString(Page);
                logger.info("渲染完成，准备响应页面给客户端");
                res.end(htmlString, "utf8");
                return;
            } catch (err) {
                res.end(getErrorPageRenderString(), "utf-8");
                logger.error("服务端路由处理时出现异常: ", err.message, " ; stack: ", err.stack);
            }
        });
    }

    private getUrlPath(url) {
        return url.split("?")[0];
    }
}
