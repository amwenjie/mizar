import { loadableReady } from '@loadable/component'
import React from "react";
import ReactDom from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { IPageRouter } from "../interface.js";
import { getStore } from "./getStore.js";
import RouteContainer from "./components/RouteContainer/index.js";
import appState from "./libs/state.js";

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
