import { parse } from "query-string";
import React, { useEffect } from "react";
import { useLocation, useRoutes, renderMatches } from "react-router-dom";
import { loadingId, pageInit } from "../../../../config";
import { reduxConnect } from "../../../connect";
import { getInitialData } from "../../metaCollector";
import getMatchedBranch from "../../getMatchedBranch";
import getLoading from "../FetchLoading";

const FetchLoading = getLoading(loadingId);

function Routes(props) {
    return useRoutes(props.router);
}

function RouteContainer(props) {
    const { pathname, search } = useLocation();
    useEffect(() => {
        const cb = async () => {
            // 当在浏览器端用无刷新的形式切换页面时，该函数被触发
            const matchedBranch = await getMatchedBranch(props.pageRouter, pathname);
            if (!matchedBranch) {
                window.location.reload();
                return;
            }
            const { preloadData, pageReducerName, pageComName } = await getInitialData(matchedBranch,
                {
                    baseUrl: pathname,
                    query: parse(search),
                },
            );
            Object.keys(preloadData).forEach(name => {
                props.dispatch({ type: `${pageInit}${name}`, data: preloadData[name] });
            });
            if (preloadData[pageReducerName] && preloadData[pageReducerName].title) {
                document.title = preloadData[pageReducerName].title;
            }
        };
        cb();
    }, [pathname, search]);
    return (<>
        <Routes router={props.pageRouter} />
        <FetchLoading />
    </>);
}

export default reduxConnect()(RouteContainer);
