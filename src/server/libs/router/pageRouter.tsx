import Express from "express";
import React from "react";
import * as ReactDomServer from "react-dom/server";
import { Provider } from "react-redux";
import { matchRoutes, renderRoutes } from "react-router-config";
import { Route, StaticRouter, Switch } from "react-router-dom";
import { createStore } from "redux";
import { loadingId } from "../../../config";
import { getReducerName as getLoadingReducerName } from "../../../iso/libs/components/Loading";
import RootContainer from "../../../iso/libs/components/RootContainer";
import RouteContainer from "../../../iso/libs/components/RouteContainer";
import { getRootReducer } from "../../../iso/libs/metaCollector";
import appState from "../../../iso/libs/state";
import getLogger from "../../utils/getLogger";
// import { getLogger } from "../../../iso/utils/getLogger";
import { IInitialRenderData, IMetaProps } from "../../../interface";
import checkNotSSR from "../../utils/checkNotSSR";
import getAssetsURI from "../../utils/getAssetsURI";
import { getPageCSSDeps } from "../../utils/getPageDeps";
import getSSRInitialData from "../../utils/getSSRInitialData";
import Router from "./index";

// const logger = getLogger("server/libs/router/pageRouter");
const logger = getLogger().getLogger("server/libs/router/pageRouter");

export default class PageRouter extends Router {
    private meta: IMetaProps;
    private proxyConfig;
    private pageRouter;
    
    protected router: Express.Router = Express.Router();

    public constructor(pageRouter, meta) {
        super();
        this.setPageRouter(pageRouter, meta);
    }

    public setRouter() {
        this.router.use(async (req, res, next) => {
            res.write("<!DOCTYPE html>");
            res.on('finish', () => {
                logger.info("响应完成.");
            });
            try {
                const originalUrl = req.originalUrl;
                const path = this.getUrlPath(originalUrl);
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
                const Page = await this.getPage(req, branch[0]);
                const htmlStream = this.getPageRenderStream(Page);
                htmlStream.pipe(res);
                // logger.info("响应完成.");
                // const htmlString = ReactDomServer.renderToString(Page);
                // logger.info("渲染完成，准备响应页面给客户端");
                // res.write("<!DOCTYPE html>");
                // res.write(htmlString, "utf8");
                // res.end(() => {
                //     logger.info("响应完成.");
                // });
                return;
            } catch (err) {
                this.getServerErrorPageStream().pipe(res);
                logger.error("服务端路由处理时出现异常: ", err.message, " ; stack: ", err.stack);
            }
        });
    }

    private setPageRouter(pageRouter, meta) {
        this.pageRouter = pageRouter;
        this.meta = meta;
        // this.proxyConfig = proxyConfig;
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

    private async getPage(req, matchedBranch): Promise<JSX.Element> {
        const notSSR = checkNotSSR(req.query);
        let children = null;
        // let initialState = {};
        let meta = this.meta;
        // let assetsMap = [];
        let preloadData = {};
        appState.isCSR = notSSR;
        if (notSSR) {
            logger.info("请求参数携带_nossr的标志，跳过服务端首屏数据获取.");
        } else {
            const clientRouter = matchedBranch.route.clientRouter;
            let pageReducerName = "";
            logger.info("准备进行首屏数据服务端获取.");
            const initialData: IInitialRenderData = await getSSRInitialData(matchedBranch, req);
            preloadData = initialData.preloadData;
            pageReducerName = initialData.pageReducerName;
            logger.info("首屏数据服务端获取完成，准备进行服务端渲染.");

            const store = createStore(getRootReducer(), preloadData);
            // initialState = store.getState() || {};

            const styles = meta.styles.slice(0);
            const scripts = meta.scripts.slice(0);
            meta = {
                ...meta,
                styles,
                // scripts,
                ...this.getMeta(preloadData[pageReducerName] || {}),
            };

            preloadData[getLoadingReducerName(loadingId)] = this.meta.loading;

            const cssDeps = await getPageCSSDeps("page/" + initialData.pageComName);
            if (cssDeps && cssDeps.length) {
                meta.styles = meta.styles.concat(cssDeps);
            }

            const pageStyleURI = getAssetsURI("page/" + initialData.pageComName + ".css") as string;
            logger.debug("pageStyleURI: ", pageStyleURI);
            if (pageStyleURI) {
                meta.styles.push(pageStyleURI);
            }

            logger.debug("meta: ", meta);

            children = (<Provider store={store}>
                <StaticRouter location={req.originalUrl} context={{}}>
                    <RouteContainer pageRouter={clientRouter}>
                        {renderRoutes(clientRouter)}
                    </RouteContainer>
                </StaticRouter>
            </Provider>);
        }
        // const publicPath = getPublicPath();
        const Page = (<RootContainer
            initialState={preloadData}
            meta={meta}
            // publicPath={publicPath}
        >
            {children}
        </RootContainer>);
        // logger.info("getPage page: ")
        // logger.info(ReactDomServer.renderToString(Page));
        return Page;
    }

    private getPageRenderStream(pageComponent): NodeJS.ReadableStream {
        let htmlStream: NodeJS.ReadableStream;
        try {
            htmlStream = ReactDomServer.renderToNodeStream(pageComponent);
            logger.info("渲染完成，准备响应页面给客户端");
            // logger.info("响应完成.");
            // const htmlString = ReactDomServer.renderToString(Page);
            // logger.info("渲染完成，准备响应页面给客户端");
            // res.write("<!DOCTYPE html>");
            // res.write(htmlString, "utf8");
            // res.end(() => {
            //     logger.info("响应完成.");
            // });
        } catch (e) {
            logger.error("服务端路由处理时出现异常: ", e.message, " ; stack: ", e.stack);
            htmlStream = this.getServerErrorPageStream();
        }
        return htmlStream;
    }

    private getServerErrorPageStream(): NodeJS.ReadableStream {
        return ReactDomServer.renderToNodeStream(<html>
            <head>
                <meta charSet="UTF-8" />
            </head>
            <body>服务出错，稍后重试</body>
        </html>);
    }
}
