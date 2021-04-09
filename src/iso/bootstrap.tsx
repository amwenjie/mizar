import * as React from "react";
import * as ReactDom from "react-dom";
import { Provider } from "react-redux";
import { renderRoutes } from "react-router-config";
import { BrowserRouter } from "react-router-dom";
import { getStore } from "./getStore";
import RouteContainer from "./libs/components/RouteContainer";
// 临时方案，后续需寻求在tools中统一处理
import "./libs/polyfill";
import state from "./libs/state";

declare let __webpack_public_path__: string;
export function bootstrap(pageRouter) {
    __webpack_public_path__ = (window as any).publicPath;
    return (id: string = "app") => {
        ReactDom.hydrate(
            <Provider store={getStore()} >
                <BrowserRouter>
                    <RouteContainer pageRouter={pageRouter}>
                        {renderRoutes(pageRouter)}
                    </RouteContainer>
                </BrowserRouter>
            </Provider>,
            document.getElementById(id),
        );
        state.isClientBootstraped = true;
    };
}
