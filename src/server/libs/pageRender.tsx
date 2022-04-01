import { ChunkExtractor } from "@loadable/server";
import { type Request, type Response } from "express";
import fs from "fs-extra";
import path from "path";
import React, { type ReactElement } from "react";
import ReactDomServer from "react-dom/server.js";
import { Provider } from "react-redux";
import { type RouteMatch } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server.js";
import { createStore } from "redux";
import { loadingId } from "../../config/index.js";
import { getReducerName as getLoadingReducerName } from "../../iso/components/Loading/index.js";
import RouteContainer from "../../iso/components/RouteContainer/index.js";
import { getMatchedComponent, getRootReducer } from "../../iso/libs/metaCollector.js";
import { type IInitialRenderData, type IMetaProps, type IPageRouter } from "../../interface.js";
import getHtmlString from "../utils/getHtmlString.js";
import getLogger from "../utils/logger.js";
import checkNotSSR from "../utils/checkNotSSR.js";
import getSSRInitialData from "../utils/getSSRInitialData.js";
import state from "./state.js";

const logger = getLogger().getLogger("server/libs/pageRender");


const clientStatsFile = path.resolve("./loadable-stats.json");
if (!fs.existsSync(clientStatsFile)) {
    throw new Error("./loadable-stats.json must exist，nor application couldn't deploy");
}
const extractorConf = { statsFile: clientStatsFile, entrypoints: ["index"] };

export const createScriptTag = (url: string) => `<script defer src="${url}"></script>`;

export const createStyleTag = (url: string) => `<link href="${url}" type="text/css" rel="stylesheet">`;

export async function getHtmlMeta(extractor: ChunkExtractor): Promise<IMetaProps> {
    const meta = {
        ...state.meta,
    };
    meta.styles = meta.styles
        .map(createStyleTag)
        .concat(extractor.getStyleTags());
    meta.scripts = meta.scripts
        .map(createScriptTag)
        .concat(
            extractor.getScriptTags().replace(/\s+async\s+/ig, " defer ")
        );
    // meta.links = meta.links.concat(extractor.getLinkTags());

    logger.debug("meta: ", meta);
    return meta;
}

function getMetaData(pageInitialState) {
    const meta: { title?, description?, keywords? } = {};
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
    return '<html><head><meta charset="utf-8" /><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><meta http-equiv="x-ua-compatible" content="ie=edge" /><meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1.0,maximum-scale=1,user-scalable=no" /></head><body>服务出错，稍后重试</body></html>';
}

export function getComRenderString(com: ReactElement) {
    return ReactDomServer.renderToString(com);
}

export async function getResponsePage(req: Request, res: Response, pageRouter: IPageRouter[], matchedRoute: RouteMatch): Promise<string> {
    const notSSR = checkNotSSR(req.query);
    let children = "";
    let preloadData: any = {};
    let pageReducerName = "";
    const matchedPageCom = getMatchedComponent(matchedRoute);
    const extractor = new ChunkExtractor(extractorConf);
    const jsx = extractor.collectChunks(matchedPageCom.element as JSX.Element);
    let meta = await getHtmlMeta(extractor);
    if (notSSR) {
        logger.info("请求参数携带_notssr的标志，跳过服务端首屏数据获取.");
    } else {
        logger.info("准备进行首屏数据服务端获取.");
        const initialData: IInitialRenderData = await getSSRInitialData(matchedPageCom, req);
        preloadData = initialData.preloadData;
        pageReducerName = initialData.pageReducerName;
        logger.info("首屏数据服务端获取完成，准备进行服务端渲染.");

        const store = createStore(getRootReducer(), preloadData);

        preloadData[getLoadingReducerName(loadingId)] = state.meta.loading;

        meta = {
            ...meta,
            ...getMetaData(preloadData[pageReducerName] || {}),
        };

        children = getComRenderString(<Provider store={store}>
            <StaticRouter location={req.originalUrl}>
                <RouteContainer pageRouter={pageRouter} />
            </StaticRouter>
        </Provider>);
    }

    return getHtmlString(req, res, {
        onlyCSR: notSSR,
        initialState: preloadData,
        meta,
        children,
    })
}