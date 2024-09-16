import React from "react";
import { combineReducers } from "redux";
import type { Params, RouteMatch } from "react-router-dom";
import { pageInit } from "../../config/index.js";
import type { IInitialRenderData, IMatchedRouteCom, IPageRouter } from "../../interface.js";
import { getStore } from "../getStore.js";
import { fetchWithRequestObject } from "../fetch.js";
import getLogger from "../utils/logger.js";
import appState from "./state.js";

const logger = getLogger().getLogger("iso/libs/metaCollector");

const finalReducer = {};
const reducerComponentMap = {};

function finalPageReducer(pageReducer, reducerName) {
    // reducer中间件
    return (state, action) => {
        if (action.type.startsWith(pageInit)) {
            // 页面初始数据获取后触发的dispatch
            // 理论上只需要触发preloadData中包含的reducerName对应reducer即可
            // action.type中包含的reducerName和此处存储的reduerName不相等，直接返回state
            const rg = new RegExp("^" + pageInit + "(.+)$");
            const matched = rg.exec(action.type);
            if (matched && matched[1] === reducerName) {
                // const nextState = pageReducer(state, action);
                return {
                    ...state,
                    ...action.data,
                };
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

export function getMatchedComponent(matchedRoute: RouteMatch): {
    element: React.ReactNode;
    pageComName?: string;
    params?: Params;
 } | null {
    if (matchedRoute.route.element) {
        return {
            params: matchedRoute.params,
            element: matchedRoute.route.element as React.ReactNode,
            pageComName: (matchedRoute.route as IPageRouter).name,
        };
    }
    return null;
}

export async function getInitialData(matchedPageCom: IMatchedRouteCom, request): Promise<IInitialRenderData> {
    // 该方法根据路由和请求找到对应的组件获取初始数据。被client端RouterContainer和server端路由入口调用。
    if (matchedPageCom && matchedPageCom.element) {
        const component = matchedPageCom.element;
        // if (typeof matchedPageCom.element.load === "function") {
        //     component = await component.load();
        // }
        const { preloadData, pageReducerName } = await collectPreloadData(
            reducerComponentMap, component, request, {
                body: request.body || {},
                query: request.query || {},
                params: matchedPageCom.params ? {
                    ...matchedPageCom.params,
                } : {},
            });
        return {
            preloadData,
            pageReducerName,
            pageComName: matchedPageCom.pageComName,
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
    return {
        ...initialState,
        ...initialData,
    };
}

async function collectPreloadData(rcMap, targetComponent, request, params) {
    let preloadData = {};
    let pageReducerName = "";
    await Promise.all(
        Object.keys(rcMap)
            .map(async reducerName => {
                const isCompEqual = rcMap[reducerName].component === targetComponent;
                const isCompTypeEqual = rcMap[reducerName].component === targetComponent.type; // 客户端路由切换react-router v6 route.element.type才是原component
                if (isCompEqual || isCompTypeEqual) {
                    pageReducerName = reducerName;
                    const reducer = rcMap[reducerName].reducer;
                    const subComponents = rcMap[reducerName].subComponents;
                    const currComponent = rcMap[reducerName].component;
                    // 找到当前页的组件
                    preloadData[reducerName] = await getSinglePreloadData(
                        currComponent, reducer, request, params);
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
