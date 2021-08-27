import React, { ReactElement } from "react";
import ReactDomServer from "react-dom/server";
import { Provider } from "react-redux";
import { renderRoutes } from "react-router-config";
import { Route, StaticRouter, Switch } from "react-router-dom";
import { createStore } from "redux";
import { loadingId } from "../../config";
import { getReducerName as getLoadingReducerName } from "../../iso/libs/components/FetchLoading";
import RootContainer from "../../iso/libs/components/RootContainer";
import RouteContainer from "../../iso/libs/components/RouteContainer";
import { getRootReducer } from "../../iso/libs/metaCollector";
import getLogger from "../utils/getLogger";
import { IInitialRenderData } from "../../interface";
import checkNotSSR from "../utils/checkNotSSR";
import { getPageCSSDeps, getPageJSDeps } from "../utils/getPageDeps";
import getSSRInitialData from "../utils/getSSRInitialData";
import state from "./state";
const logger = getLogger().getLogger("server/libs/comController");

function getMeta(pageInitialState) {
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

export function getErrorPageRenderString() {
    return '<html><head><meta charset="UTF-8" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta http-equiv="x-ua-compatible" content="ie=edge" /><meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1.0,maximum-scale=1,user-scalable=no" /></head><body>服务出错，稍后重试</body></html>';
}

export function getComRenderString(com) {
    return ReactDomServer.renderToString(com);
}

export async function getPage(req, matchedBranch): Promise<ReactElement> {
    const notSSR = checkNotSSR(req.query);
    let children = null;
    let meta = state.meta;
    let preloadData: any = {};
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

        const styles = meta.styles.slice(0);
        meta = {
            ...meta,
            styles,
            ...getMeta(preloadData[pageReducerName] || {}),
        };

        preloadData[getLoadingReducerName(loadingId)] = state.meta.loading;

        const pageRouterName = "page/" + initialData.pageComName;
        const pageCssDeps = getPageCSSDeps(pageRouterName);
        if (pageCssDeps && pageCssDeps.length) {
            meta.styles = meta.styles.concat(pageCssDeps);
        }

        const pageJsDeps = getPageJSDeps(pageRouterName);
        if (pageJsDeps && pageJsDeps.length) {
            meta.scripts = meta.scripts.concat(pageJsDeps);
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
        isCSR={notSSR}
        initialState={preloadData}
        meta={meta}
        // publicPath={publicPath}
    >
        {children}
    </RootContainer>);
    return Page;
}