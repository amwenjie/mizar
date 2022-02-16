import React from "react";
import ReactDom from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { IPageRouter } from "../interface";
import { getStore } from "./getStore";
import RouteContainer from "./libs/components/RouteContainer";
import loadComponent from "./libs/getMatchedBranch";
import appState from "./libs/state";

export function bootstrap(pageRouter: IPageRouter[]) {
    return async (id: string = "app") => {
        await loadComponent(pageRouter, location.pathname);
        const r = (window as any).__isCSR__ === false ? "hydrate" : "render";
        // const matchedBranch = matchRoutes(pageRouter, window.location);
        ReactDom[r](
            <Provider store={getStore()} >
                <BrowserRouter>
                    <RouteContainer pageRouter={pageRouter} />
                </BrowserRouter>
            </Provider>,
            document.getElementById(id),
        );
        appState.isClientBootstraped = true;
    };
}
