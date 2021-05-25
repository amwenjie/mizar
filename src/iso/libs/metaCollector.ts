import { combineReducers } from "redux";
import { pathToRegexp, match, parse, compile, MatchResult } from "path-to-regexp";
import * as config from "../../config";
import { fetchWithRequestObject } from "../fetch";
import { getStore } from "../getStore";
import appState from "./state";
import getLogger from "../utils/getLogger";

const logger = getLogger().getLogger("iso/libs/metaCollector");

const finalReducer = {};
const reducerComponentMap = {};

function finalPageReducer(pageReducer) {
    // reducer中间件
    return (state, action) => {
        if (action.type === config.frameworkId || action.type === config.pageInit) {
            // // 用来做页面首屏渲染的初始数据
            return { ...state, ...action.data };
            // return { ...state };
        } else {
            return pageReducer(state, action);
        }
    };
}

export function registerRedux(reducer, reducerName, component, subComponents) {
    finalReducer[reducerName] = finalPageReducer(reducer);
    reducerComponentMap[reducerName] = { component, reducer, subComponents };
    if (appState.isClientBootstraped) {
        const store = getStore();
        store.replaceReducer(combineReducers(finalReducer));
    }
}

export function getRootReducer(): any {
    return combineReducers(finalReducer);
}

function getMatchedComponent(matchedBranch): {
    component: React.Component,
    params?: any,
 } | null {
    if (matchedBranch.route.component) {
        return {
            component: matchedBranch.route.component,
        };
    } else {
        const url = matchedBranch.match.url;
        const clientRouter = matchedBranch.route.clientRouter;
        for (let i = 0, len = clientRouter.length; i < len; i++) {
            const r = clientRouter[i];
            if (!r.path) {
                continue;
            }
            const matched = match(r.path, {
                decode: decodeURIComponent,
                encode: encodeURI,
            })(url);
            const isMatched = matched !== false;
            if (isMatched) {
                return {
                    params: (matched as MatchResult).params,
                    component: r.component,
                };
            }
        }
        return null;
    }
}

export async function getInitialData(matchedBranch, request): Promise<{preloadData: any, pageReducerName: string}> {
    // 该方法根据路由和请求找到对应的组件获取初始数据。被client端RouterContainer和server端路由入口调用。
    const query = request.query;
    let urlParams = matchedBranch.match.params;
    const matched = getMatchedComponent(matchedBranch);
    if (matched) {
        const pageComponent = matched.component;
        if (matched.params) {
            urlParams = matched.params;
        }
        const { preloadData, pageReducerName } = await collectPreloadData(
            reducerComponentMap, pageComponent, request, query, urlParams);
        return { preloadData, pageReducerName };
    } else {
        return {
            preloadData: {},
            pageReducerName: "",
        };
    }
}

async function getSinglePreloadData(component, reducer, request, query, urlParams): Promise<any> {
    let initialData = {};
    if (component.getInitialData) {
        try {
            initialData = await component.getInitialData(fetchWithRequestObject(request), query, urlParams);
            // logger.info("getSinglePreloadData initialData", initialData);
        } catch (e) {
            logger.error("获取初始数据失败", e);
        }
    } else {
        logger.info("no getInitialData.");
    }
    let initialState = reducer(undefined, {});
    initialState = typeof initialState === "object" ? initialState : {};
    return Object.assign({}, initialState, initialData);
}

async function collectPreloadData(rcMap, targetComponent, request, query, urlParams) {
    let preloadData = {};
    let pageReducerName = "";
    await Promise.all(
        Object.keys(rcMap)
            .map(async (reducerName) => {
                if (rcMap[reducerName].component === targetComponent) {
                    pageReducerName = reducerName;
                    const reducer = rcMap[reducerName].reducer;
                    const subComponents = rcMap[reducerName].subComponents;
                    // 找到当前页的组件
                    preloadData[reducerName] = await getSinglePreloadData(
                        targetComponent, reducer, request, query, urlParams);
                    if (subComponents) {
                        await Promise.all(
                            subComponents.map(async (subComponent) => {
                                const subComPreloadData = await collectPreloadData(
                                    rcMap, subComponent, request, query, urlParams);
                                preloadData = { ...preloadData, ...subComPreloadData.preloadData };
                            }),
                        );
                    }
                }
            }),
    );
    return { preloadData, pageReducerName };
}
