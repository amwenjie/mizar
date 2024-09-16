import { ChunkExtractor } from "@loadable/server";
import { configureStore } from "@reduxjs/toolkit";
import type { Request, Response } from "express";
import fs from "fs-extra";
import path from "path";
import React from "react";
import ReactDomServer from "react-dom/server";
import { Provider } from "react-redux";
import type { RouteMatch } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server.js";
import { loadingId } from "../../config/index.js";
import { getReducerName as getLoadingReducerName } from "../../iso/components/Loading/index.js";
import RouteContainer from "../../iso/components/RouteContainer/index.js";
import { getMatchedComponent, getRootReducer } from "../../iso/libs/metaCollector.js";
import type { IInitialRenderData, IMetaProps, IPageRouter } from "../../interface.js";
import getLogger from "../utils/logger.js";
import checkNotSSR from "../utils/checkNotSSR.js";
import getSSRInitialData from "../utils/getSSRInitialData.js";
import state from "./state.js";

const logger = getLogger().getLogger("server/libs/pageRender");

const clientStatsFile = path.resolve("./loadable-stats.json");
if (!fs.existsSync(clientStatsFile)) {
    throw new Error("application couldn't deploy without ./loadable-stats.json");
}
const extractorConf = { statsFile: clientStatsFile, entrypoints: ["index"] };

export const createScriptElement =
    (url: string|JSX.Element, index?: number) =>
        typeof url === "string"
            ? (typeof index === "number"
                ? <script defer key={"sct" + index} src={url}></script>
                : <script defer src={url}></script>)
            : url;

export const createStyleElement =
    (url: string|JSX.Element, index?: number) =>
        typeof url === "string"
            ? (typeof index === "number"
                ? <link href={url} key={"stl" + index} type="text/css" rel="stylesheet" />
                : <link href={url} type="text/css" rel="stylesheet" />)
            : url;

export function getHtmlMeta(extractor: ChunkExtractor): IMetaProps {
    const meta = {
        ...state.meta,
    };
    let styleIndex = meta.styles.length;
    let scriptIndex = meta.scripts.length;
    let linkIndex = meta.links.length;
    meta.styles = meta.styles
        .map(createStyleElement)
        .concat(extractor.getStyleElements(() => {
            return {
                key: "stl" + styleIndex++
            };
        }));
    meta.scripts = meta.scripts
        .map(createScriptElement)
        .concat(
            extractor.getScriptElements(() => {
                return {
                    defer: true,
                    key: "sct" + scriptIndex++
                };
            })
            // .replace(/\s+async\s+/ig, " defer ")
        );
    meta.links = meta.links.concat(extractor.getLinkElements(
        () => {
            return {
                key: "lnk" + linkIndex++
            };
        }
    ));

    logger.debug("meta: ", meta);
    return meta;
}

function getMetaData(pageInitialState: IMetaProps) {
    const meta: IMetaProps = {};
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

function getClientStoreData(initialState, onlyCSR) {
    return `;window.__PRELOADED_STATE__=${JSON.stringify(initialState || {}).replace(/</g, "\\u003c")};${onlyCSR ? ";window.__onlyCSR__=" + JSON.stringify(onlyCSR) + ";" : ""}`;
}

let afsFn;

function getAutoFontSizeFn(calcRootFontSize) {
    if (typeof afsFn === "undefined") {
        if (typeof calcRootFontSize === "number") {
            afsFn = ['(function () {',
                'var debc;',
                'function setRootFontSize() {',
                'var rootElement = document.documentElement;',
                'var styleElement = document.createElement("style");',
                'var dpr = Number(window.devicePixelRatio.toFixed(5)) || 1;',
                'var rootFontSize = rootElement.clientWidth / ',
                calcRootFontSize / 100,
                ';rootElement.setAttribute("data-dpr", dpr.toString());',
                'rootElement.style.fontSize = rootFontSize + "px";',
                // 'rootElement.firstElementChild.appendChild(styleElement);',
                // 'styleElement.innerHTML = "html{font-size:" + rootFontSize + "px!important;}";',
                '}setRootFontSize();',
                'window.addEventListener("resize", function () { clearTimeout(debc); debc = setTimeout(setRootFontSize, 500); });',
                '}());'
            ].join('');
        } else if (typeof calcRootFontSize === "function") {
            afsFn = "(" + calcRootFontSize.toString() + "());";
        } else {
            afsFn = "";
        }
    }
    return afsFn;
}

function getHtmlJSX(props) {
    const {
        onlyCSR = true,
        initialState,
        children,
        resLocals,
        meta,
    } = props;
    const {
        title,
        keywords,
        description,
        favicon,
        styles = [],
        scripts = [],
        links = [],
        metas = [],
        calcRootFontSize,
    } = meta;
    const clientStore = getClientStoreData(initialState, onlyCSR);
    const rfs = getAutoFontSizeFn(calcRootFontSize);

    return (<html>
        <head>
            <meta charSet="utf-8" />
            <meta httpEquiv="content-type" content="text/html; charset=utf-8" />
            <title>{title}</title>
            <meta httpEquiv="x-ua-compatible" content="ie=edge" />
            {keywords && <meta name="keywords" content={keywords} />}
            {description && <meta name="description" content={description} />}
            <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1.0,maximum-scale=1,user-scalable=no" />
            {metas}
            {links}
            {favicon && [
                <link key="l1" href={favicon} rel="icon" />,
                <link key="l2" href={favicon} rel="shortcut icon" />,
                <link key="l3" href={favicon} rel="bookmark" />]}
            {rfs && <script
                nonce={resLocals.fsResponsiveNonce}
                dangerouslySetInnerHTML={{__html: rfs}}
            ></script>}
            {styles}
        </head>
        <body>
            <div id="app">
                {children}
            </div>
            <script
                nonce={resLocals.csDataNonce}
                dangerouslySetInnerHTML={{__html: clientStore}}
            ></script>
            {scripts}
        </body>
    </html>);
}

export async function getResponsePage(
    req: Request,
    res: Response,
    pageRouter: IPageRouter[],
    matchedRoute: RouteMatch
): Promise<ReactDomServer.PipeableStream> {
    const notSSR = checkNotSSR(req.query);
    let children: React.ReactNode = "";
    let preloadData: any = {};
    let pageReducerName = "";
    const matchedPageCom = getMatchedComponent(matchedRoute);
    const extractor = new ChunkExtractor(extractorConf);
    const jsx = extractor.collectChunks(matchedPageCom.element as JSX.Element);
    let meta = getHtmlMeta(extractor);
    if (notSSR) {
        logger.info("请求参数携带_notssr的标志，跳过服务端首屏数据获取.");
    } else {
        logger.info("准备进行首屏数据服务端获取.");
        const initialData: IInitialRenderData = await getSSRInitialData(matchedPageCom, req);
        preloadData = initialData.preloadData;
        pageReducerName = initialData.pageReducerName;
        logger.info("首屏数据服务端获取完成，准备进行服务端渲染.");

        const store = configureStore({
            reducer: getRootReducer(),
            preloadedState: preloadData,
        });

        preloadData[getLoadingReducerName(loadingId)] = state.meta.loading;

        meta = {
            ...meta,
            ...getMetaData(preloadData[pageReducerName] || {}),
        };

        children = (<Provider store={store}>
            <StaticRouter location={req.originalUrl}>
                <RouteContainer pageRouter={pageRouter} />
            </StaticRouter>
        </Provider>);
    }

    return ReactDomServer.renderToPipeableStream(getHtmlJSX({
        onlyCSR: notSSR,
        initialState: preloadData,
        meta,
        resLocals: res.locals,
        children,
    }), { 
        onError: (err) => {
            res.end(getErrorPageRenderString(), "utf-8");
            console.error(err);
        }
    });
}