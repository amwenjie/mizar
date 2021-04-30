import * as Express from "express";
import * as React from "react";
import * as ReactDomServer from "react-dom/server";
import { Provider } from "react-redux";
import { matchRoutes, renderRoutes } from "react-router-config";
import { Route, StaticRouter, Switch } from "react-router-dom";
import { createStore } from "redux";
import * as config from "../../../config";
import * as Loading from "../../../iso/libs/components/Loading";
import RootContainer from "../../../iso/libs/components/RootContainer";
import RouteContainer from "../../../iso/libs/components/RouteContainer";
import * as metaCollector from "../../../iso/libs/metaCollector";
import { getLogger } from "../../../iso/libs/utils/getLogger";
import { getPublicPath } from "../../utils/getConfig";
import { IProxyConfig } from "../../interface";
import Router from "./index";

const logger = getLogger("server/libs/router/pageRouter");

export default class PageRouter extends Router {
    private meta;
    private proxyConfig;
    private pageRouter;
    
    protected router: Express.Router = Express.Router();

    public constructor(pageRouter, meta, proxyConfig?: IProxyConfig[]) {
        super();
        this.setPageRouter(pageRouter, meta, proxyConfig);
    }

    public setRouter() {
        this.router.use(async (req, res, next) => {
            try {
                const originalUrl = req.originalUrl;
                const path = this.getUrlPath(originalUrl);
                const branch = matchRoutes(this.pageRouter, path);
                
                logger.log("originalUrl: ", originalUrl);
                logger.log("path: ", path);
                logger.log("branch: ", branch);

                if (!branch[0]) {
                    logger.warn(`not match any router branch. originalUrl: ${originalUrl}, path: ${path}`);
                    // 找不到匹配的页面，由express的404兜底
                    next();
                    return;
                }
                const clientRouter = branch[0].route.clientRouter;
                logger.log("match router branch.");
                let preloadData = {};
                let pageReducerName = "";
                if ('_nossr' in req.query) {
                    logger.log("请求参数携带_nossr的标志，跳过服务端首屏数据获取.");
                } else {
                    logger.log("准备进行首屏数据服务端获取.");
                    const initialData = await metaCollector.getInitialData(branch[0], req);
                    if (initialData) {
                        if (initialData.preloadData) {
                            preloadData = initialData.preloadData;
                        }
                        if (initialData.pageReducerName) {
                            pageReducerName = initialData.pageReducerName;
                        }
                    }
                    logger.log("首屏数据服务端获取完成，准备进行服务端渲染.");
                }
                const store = createStore(metaCollector.getRootReducer(), preloadData);
                const initialState: any = store.getState() || {};
                initialState[Loading.getReducerName(config.loadingId)] = this.meta.loading;
                const meta = Object.assign({}, this.meta, this.getMeta(initialState[pageReducerName] || {}));
                const publicPath = getPublicPath();
                const Page = (<RootContainer
                    initialState={initialState}
                    meta={meta}
                    publicPath={publicPath}>
                    <Provider store={store}>
                        <StaticRouter location={req.originalUrl} context={{}}>
                            <RouteContainer pageRouter={clientRouter}>
                                {renderRoutes(clientRouter)}
                            </RouteContainer>
                        </StaticRouter>
                    </Provider>
                </RootContainer>);
                const htmlStream = ReactDomServer.renderToNodeStream(Page);
                logger.log("渲染完成，准备响应页面给客户端");
                res.write("<!DOCTYPE html>");
                htmlStream.pipe(res);
                res.on('finish', () => {
                    logger.log("响应完成.");
                });
                // logger.log("响应完成.");
                // const htmlString = ReactDomServer.renderToString(Page);
                // logger.log("渲染完成，准备响应页面给客户端");
                // res.write("<!DOCTYPE html>");
                // res.write(htmlString, "utf8");
                // res.end(() => {
                //     logger.log("响应完成.");
                // });
            } catch (e) {
                res.write("<!DOCTYPE html><html><head><meta charset=\"UTF-8\" /></head><body>服务出错，稍后重试</body></html>", "utf8");
                res.on('finish', () => {
                    logger.log("响应完成.");
                });
                logger.error("服务端路由处理时出现异常:", e);
            }
        });
    }

    private setPageRouter(pageRouter, meta, proxyConfig: IProxyConfig[]) {
        this.pageRouter = pageRouter;
        this.meta = meta;
        this.proxyConfig = proxyConfig;
    }

    private getMeta(pageInitialState) {
        const meta: { title?, description?, keywords?} = {};
        if (pageInitialState.title) {
            meta.title = pageInitialState.title;
        }
        if (pageInitialState.description) {
            meta.description = pageInitialState.description;
        }
        if (pageInitialState.keywords) {
            meta.keywords = pageInitialState.keywords;
        }
        return meta;
    }

    private getUrlPath(url) {
        return url.split("?")[0];
    }
}
