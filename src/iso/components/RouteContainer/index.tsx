import queryString from "query-string";
import React, { useEffect } from "react";
import { useLocation, useRoutes } from "react-router-dom";
import { loadingId, pageInit } from "../../../config/index.js";
import type { IPageRouter, IRouteContainerProps } from "../../../interface.js";
import { reduxConnect } from "../../connect.js";
import { getInitialData, getMatchedComponent } from "../../libs/metaCollector.js";
import getMatchedBranch from "../../libs/getMatchedBranch.js";
import getLoading from "../Loading/index.js";

const FetchLoading = getLoading(loadingId);

declare const IS_SERVER_RUNTIME;

let isFirstSSR = true;
if (!IS_SERVER_RUNTIME) {
    isFirstSSR = !(window as any).__onlyCSR__;
}

function Routes(props: {
    router: IPageRouter[];
    children?: React.ReactNode;
}) {
    return useRoutes(props.router);
}

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

function RouteContainer(props: IRouteContainerProps) {
    const { pathname, search } = useLocation();
    useEffect(() => {
        const cb = async () => {
            // 当在浏览器端用无刷新的形式切换页面时，该函数被触发
            const matchedBranch = getMatchedBranch(props.pageRouter, pathname);
            if (!matchedBranch) {
                window.location.reload();
                return;
            }
            const matchedPageCom = getMatchedComponent(matchedBranch);
            const { preloadData, pageReducerName, pageComName } = await getInitialData(matchedPageCom,
                {
                    baseUrl: pathname,
                    query: queryString.parse(search),
                },
            );
            Object.keys(preloadData).forEach(name => {
                props.dispatch({ type: `${pageInit}${name}`, data: preloadData[name] });
            });
            if (preloadData[pageReducerName] && preloadData[pageReducerName].title) {
                document.title = preloadData[pageReducerName].title;
            }
        };
        if (isFirstSSR) {
            isFirstSSR = false;
            return;
        }
        cb();
    }, [pathname, search]);
    return (<>
        <ScrollToTop />
        <Routes router={props.pageRouter} />
        <div className="loading-container"><FetchLoading /></div>
    </>);
}

export default reduxConnect()(RouteContainer);
