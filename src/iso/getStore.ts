import { applyMiddleware, compose, createStore } from "redux";
import thunk from "redux-thunk";
import { getRootReducer } from "./libs/metaCollector";
import isServer from "./utils/isServer";

let store;
export function getStore() {
    if (store) {
        return store;
    }
    if (isServer) { // typeof window === "undefined") {
        // 非浏览器环境
        return;
    }
    const initialState = (window as any).__INITIAL_STATE__;
    delete (window as any).__INITIAL_STATE__;

    // const reduxDevToolMiddleware = (window as any).__REDUX_DEVTOOLS_EXTENSION__
    //     && (window as any).__REDUX_DEVTOOLS_EXTENSION__();
    const composeEnhancers =
        (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
            (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
            }) : compose;
    store = createStore(getRootReducer(),
        initialState,
        composeEnhancers(applyMiddleware(thunk)),
    );
    return store;
}
