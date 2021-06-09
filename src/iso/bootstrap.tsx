import React from "react";
import ReactDom from "react-dom";
import { Provider } from "react-redux";
import { renderRoutes, RouteConfig } from "react-router-config";
import { BrowserRouter } from "react-router-dom";
import { IPageRouter } from "../interface";
import { getStore } from "./getStore";
import RouteContainer from "./libs/components/RouteContainer";
import loadComponent from "./libs/getMatchedBranch";
// 临时方案，后续需寻求在tools中统一处理
import "./libs/polyfill";
import appState from "./libs/state";

export function bootstrap(pageRouter: IPageRouter[]) {
    return async (id: string = "app") => {
        await loadComponent(pageRouter as RouteConfig[], location.pathname);
        const r = (window as any).__isCSR__ === false ? "hydrate" : "render";
        ReactDom[r](
            <Provider store={getStore()} >
                <BrowserRouter>
                    <RouteContainer pageRouter={pageRouter}>
                        {renderRoutes(pageRouter as RouteConfig[])}
                    </RouteContainer>
                </BrowserRouter>
            </Provider>,
            document.getElementById(id),
        );
        appState.isClientBootstraped = true;
    };
}
