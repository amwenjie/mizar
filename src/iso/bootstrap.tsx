import React from "react";
import ReactDom from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter, matchRoutes, Routes, RouteObject, renderMatches, useRoutes } from "react-router-dom";
import { IPageRouter } from "../interface";
import { getStore } from "./getStore";
import RouteContainer from "./libs/components/RouteContainer";
import loadComponent from "./libs/getMatchedBranch";
import appState from "./libs/state";

export function bootstrap(pageRouter: IPageRouter[]) {
    return async (id: string = "app") => {
        await loadComponent(pageRouter as RouteObject[], location.pathname);
        const r = (window as any).__isCSR__ === false ? "hydrate" : "render";
        // const matchedBranch = matchRoutes(pageRouter, window.location);
        const Routes = (props) => {
            return useRoutes(props.pageRouter);
        }
        ReactDom[r](
            <Provider store={getStore()} >
                <BrowserRouter>
                    <RouteContainer pageRouter={pageRouter}>
                        {/* {renderMatches(matchedBranch)} */}
                        <Routes pageRouter={pageRouter} />
                    </RouteContainer>
                </BrowserRouter>
            </Provider>,
            document.getElementById(id),
        );
        appState.isClientBootstraped = true;
    };
}
