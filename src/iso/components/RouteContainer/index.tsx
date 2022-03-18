import { parse } from "query-string";
import React, { useEffect } from "react";
import { useLocation, useRoutes } from "react-router-dom";
import { loadingId, pageInit } from "../../../config";
import { reduxConnect } from "../../connect";
import { getInitialData, getMatchedComponent } from "../../libs/metaCollector";
import getMatchedBranch from "../../libs/getMatchedBranch";
import getLoading from "../Loading";

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
            const matchedPageCom = getMatchedComponent(matchedBranch);
            const { preloadData, pageReducerName, pageComName } = await getInitialData(matchedPageCom,
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
        <div className="loading-container"><FetchLoading /></div>
    </>);
}

export default reduxConnect()(RouteContainer);
