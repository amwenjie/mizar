import { loadableReady } from '@loadable/component'
import React from "react";
import ReactDom from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { IPageRouter } from "../interface";
import { getStore } from "./getStore";
import RouteContainer from "./components/RouteContainer";
import appState from "./libs/state";

export function bootstrap(pageRouter: IPageRouter[]) {
    return async (id: string = "app") => {
        const r = (window as any).__isCSR__ === false ? "hydrate" : "render";
        loadableReady(() => {
            ReactDom[r](
                <Provider store={getStore()} >
                    <BrowserRouter>
                        <RouteContainer pageRouter={pageRouter} />
                    </BrowserRouter>
                </Provider>,
                document.getElementById(id),
            );
        });
        appState.isClientBootstraped = true;
    };
}
