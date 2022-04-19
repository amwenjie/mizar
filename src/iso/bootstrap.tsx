import { loadableReady } from '@loadable/component'
import React from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { IPageRouter } from "../interface.js";
import { getStore } from "./getStore.js";
import RouteContainer from "./components/RouteContainer/index.js";
import appState from "./libs/state.js";

export function bootstrap(pageRouter: IPageRouter[]) {
    return async (id = "app"): Promise<Root> => {
        const AppJSX = (
            <Provider
                serverState={(window as any).__PRELOADED_STATE__}
                store={getStore()}
            >
                <BrowserRouter>
                    <RouteContainer pageRouter={pageRouter} />
                </BrowserRouter>
            </Provider>
        );
        const container = document.getElementById(id);
        let root;
        await loadableReady(() => {
            if ((window as any).__onlyCSR__ === false) {
                root = hydrateRoot(container, AppJSX);
            } else {
                root = createRoot(container);
                root.render(AppJSX);
            }
        });
        appState.isClientBootstraped = true;
        return root;
    };
}
