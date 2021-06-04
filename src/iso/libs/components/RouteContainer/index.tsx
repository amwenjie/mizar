import { parse } from "query-string";
import React from "react";
// import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { matchRoutes } from "react-router-config";
import { loadingId, pageInit } from "../../../../config";
import { reduxConnect } from "../../../connect";
import { getInitialData } from "../../metaCollector";
import injectAssets from "../../../utils/injectPageAssets";
import getMatchedBranch from "../../getMatchedBranch";
import getLoading from "../Loading";

const Loading = getLoading(loadingId);

interface IRouteContainer extends RouteComponentProps {
    pageRouter: any;
}

class RouteContainer extends React.Component<IRouteContainer> {
    constructor(props) {
        super(props);
        if (!props.history) {
            return;
        }
        props.history.listen(async (location, action) => {
            // 当在浏览器端用无刷新的形式切换页面时，该函数被触发
            const branch = await getMatchedBranch(props.pageRouter, location.pathname);
            if (!branch[0]) {
                return;
            }
            const { preloadData, pageReducerName, pageComName } = await getInitialData(branch[0],
                {
                    baseUrl: location.pathname,
                    query: parse(location.search),
                },
            );
            // injectAssets(pageComName);
            Object.keys(preloadData).forEach(name => {
                props.dispatch({ type: `${pageInit}${name}`, data: preloadData[name] });
            });
            if (preloadData[pageReducerName] && preloadData[pageReducerName].title) {
                document.title = preloadData[pageReducerName].title;
            }
        });
    }

    public render() {
        return (
            <div>
                {this.props.children}
                <Loading />
            </div>
        );
    }
}

export default withRouter(reduxConnect()(RouteContainer));
