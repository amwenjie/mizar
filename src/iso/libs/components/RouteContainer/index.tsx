import { parse } from "query-string";
import React, { useEffect } from "react";
// import { connect } from "react-redux";
import { RouteObject, UNSAFE_RouteContext, useLocation, Outlet } from "react-router-dom";
import { loadingId, pageInit } from "../../../../config";
import { reduxConnect } from "../../../connect";
import { getInitialData } from "../../metaCollector";
import injectAssets from "../../../utils/injectPageAssets";
import getMatchedBranch from "../../getMatchedBranch";
import getLoading from "../FetchLoading";
import { IPageRouter } from "../../../../interface";

declare const IS_SERVER_RUNTIME;
const FetchLoading = getLoading(loadingId);

// function FNCOM () {
//     const { pathname, search } = useLocation();
//     useEffect(() => {
//         const cb = async () => {
//             // 当在浏览器端用无刷新的形式切换页面时，该函数被触发
//             const branch = await getMatchedBranch(props.pageRouter, pathname);
//             if (!branch[0]) {
//                 window.location.reload();
//                 return;
//             }
//             const { preloadData, pageReducerName, pageComName } = await getInitialData(branch[0],
//                 {
//                     baseUrl: pathname,
//                     query: parse(search),
//                 },
//             );
//             // injectAssets(pageComName);
//             Object.keys(preloadData).forEach(name => {
//                 props.dispatch({ type: `${pageInit}${name}`, data: preloadData[name] });
//             });
//             if (preloadData[pageReducerName] && preloadData[pageReducerName].title) {
//                 document.title = preloadData[pageReducerName].title;
//             }
//         };
//         cb();
//     }, [pathname, search]);
// }

function RouteChange (props) {
    const { pathname, search } = useLocation();
    useEffect(() => {
        const cb = async () => {
            // 当在浏览器端用无刷新的形式切换页面时，该函数被触发
            const branch = await getMatchedBranch(props.pageRouter, pathname);
            if (!branch) {
                window.location.reload();
                return;
            }
            const { preloadData, pageReducerName, pageComName } = await getInitialData(branch[0],
                {
                    baseUrl: pathname,
                    query: parse(search),
                },
            );
            // injectAssets(pageComName);
            Object.keys(preloadData).forEach(name => {
                props.dispatch({ type: `${pageInit}${name}`, data: preloadData[name] });
            });
            if (preloadData[pageReducerName] && preloadData[pageReducerName].title) {
                document.title = preloadData[pageReducerName].title;
            }
        };
        cb();
    }, [pathname, search]);
    return (<div></div>);
}
class RouteContainer extends React.Component<IPageRouter[]> {
    constructor(props) {
        super(props);
        if (!IS_SERVER_RUNTIME) {
        }
    }

    public render() {
        return (
            <div>
                {this.props.children}
                <FetchLoading />
                <RouteChange {...this.props} />
            </div>
        );
    }
}

const withRouter = WrappedComponent => props => {
  return (
    <UNSAFE_RouteContext.Consumer>
      {context => {
        return <WrappedComponent {...props} {...context} />;
      }}
    </UNSAFE_RouteContext.Consumer>
  );
};

export default reduxConnect()(RouteContainer);
