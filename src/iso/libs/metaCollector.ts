import { combineReducers } from "redux";
import { pathToRegexp, match, parse, compile, MatchResult } from "path-to-regexp";
import * as config from "../../config";
import { IInitialRenderData } from "../../interface";
import { getStore } from "../getStore";
import { fetchWithRequestObject } from "../fetch";
import getCombinedState from "../utils/getCombinedState";
import getLogger from "../utils/getLogger";

import appState from "./state";

const logger = getLogger().getLogger("iso/libs/metaCollector");

const finalReducer = {};
const reducerComponentMap = {};

function finalPageReducer(pageReducer, reducerName) {
    // reducer中间件
    return (state, action) => {
        if (action.type.startsWith(config.pageInit)) {
            // 页面初始数据获取后触发的dispatch
            // 理论上只需要触发preloadData中包含的reducerName对应reducer即可
            // action.type中包含的reducerName和此处存储的reduerName不相等，直接返回state
            const rg = new RegExp("^" + config.pageInit + "(.+)$");
            const matched = rg.exec(action.type);
            if (matched && matched[1] === reducerName) {
                const nextState = pageReducer(state, action);
                return getCombinedState(nextState, action.data);
            }
            return state;
        }
        return pageReducer(state, action);
    };
}

export function registerRedux(reducer, reducerName, component, subComponents) {
    finalReducer[reducerName] = finalPageReducer(reducer, reducerName);
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
    component: React.Component;
    // meta?: any,
    pageComName?: string;
    params?: any;
 } | null {
    if (matchedBranch.route.component) {
        return {
            component: matchedBranch.route.component,
            pageComName: matchedBranch.route.name,
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
                    pageComName: r.name,
                    // meta: r.meta,
                };
            }
        }
        return null;
    }
}

export async function getInitialData(matchedBranch, request): Promise<IInitialRenderData> {
    // 该方法根据路由和请求找到对应的组件获取初始数据。被client端RouterContainer和server端路由入口调用。
    let urlParams = matchedBranch.match.params;
    const matched = getMatchedComponent(matchedBranch);
    if (matched) {
        const pageComponent = matched.component;
        if (matched.params) {
            urlParams = {
                ...matched.params
            };
        }
        const { preloadData, pageReducerName } = await collectPreloadData(
            reducerComponentMap, pageComponent, request, {
                body: request.body || {},
                query: request.query || {},
                params: urlParams || {},
            });
        return {
            preloadData,
            pageReducerName,
            pageComName: matched.pageComName,
        };
    } else {
        return {
            preloadData: {},
            pageComName: "",
            pageReducerName: "",
        };
    }
}

async function getSinglePreloadData(component, reducer, request, params): Promise<any> {
    let initialData = {};
    if (component.getInitialData) {
        try {
            initialData = await component.getInitialData(
                fetchWithRequestObject(request),
                params
            );
            // logger.info("getSinglePreloadData initialData", initialData);
        } catch (e) {
            logger.warn("业务方未捕获初始数据获取失败的异常 ", e);
        }
    } else {
        logger.info("component dont have getInitialData method.");
    }
    let initialState = reducer(undefined, {});
    initialState = typeof initialState === "object" ? initialState : {};
    return Object.assign({}, initialState, initialData);
}

async function collectPreloadData(rcMap, targetComponent, request, params) {
    let preloadData = {};
    let pageReducerName = "";
    await Promise.all(
        Object.keys(rcMap)
            .map(async reducerName => {
                if (rcMap[reducerName].component === targetComponent) {
                    pageReducerName = reducerName;
                    const reducer = rcMap[reducerName].reducer;
                    const subComponents = rcMap[reducerName].subComponents;
                    // 找到当前页的组件
                    preloadData[reducerName] = await getSinglePreloadData(
                        targetComponent, reducer, request, params);
                    if (subComponents) {
                        await Promise.all(
                            subComponents.map(async subComponent => {
                                const subComPreloadData = await collectPreloadData(
                                    rcMap, subComponent, request, params
                                );
                                preloadData = {
                                    ...preloadData,
                                    ...subComPreloadData.preloadData,
                                };
                            }),
                        );
                    }
                }
            }),
    );
    return { preloadData, pageReducerName };
}
