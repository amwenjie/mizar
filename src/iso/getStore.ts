import { applyMiddleware, compose, createStore } from "redux";
import thunk from "redux-thunk";
import { getRootReducer } from "./libs/metaCollector.js";

declare const IS_SERVER_RUNTIME;
let store;
export function getStore() {
    if (store) {
        return store;
    }
    if (!IS_SERVER_RUNTIME) {
        const initialState = (window as any).__INITIAL_STATE__;
        delete (window as any).__INITIAL_STATE__;

        // const reduxDevToolMiddleware = (window as any).__REDUX_DEVTOOLS_EXTENSION__
        //     && (window as any).__REDUX_DEVTOOLS_EXTENSION__();
        const composeEnhancers =
            (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
                (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
                }) : compose;
        const thunkMW = typeof thunk === "function" ? thunk : thunk.default;
        store = createStore(getRootReducer(),
            initialState,
            composeEnhancers(applyMiddleware(thunkMW)),
        );
        return store;
    }
}
