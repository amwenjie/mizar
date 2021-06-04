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

// declare let __webpack_public_path__: string;
export function bootstrap(pageRouter: IPageRouter[]) {
    // __webpack_public_path__ = (window as any).publicPath;
    return async (id: string = "app") => {
        await loadComponent(pageRouter as RouteConfig[], location.pathname);
        ReactDom[appState.isCSR ? 'render' : 'hydrate'](
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
