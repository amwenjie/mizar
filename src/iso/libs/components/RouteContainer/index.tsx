import { parse } from "query-string";
import * as React from "react";
// import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { matchRoutes } from "react-router-config";
import * as config from "../../../../config";
import { reduxConnect } from "../../../connect";
import { getInitialData } from "../../metaCollector";
import getLoading from "../Loading";
const Loading = getLoading(config.loadingId);

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
            const branch = matchRoutes(props.pageRouter, location.pathname);
            if (!branch[0]) {
                return;
            }
            const { preloadData, pageReducerName } = await getInitialData(branch[0],
                {
                    baseUrl: location.pathname,
                    query: parse(location.search),
                },
            );
            props.dispatch({ type: config.pageInit, data: preloadData[pageReducerName] });
            if (preloadData[pageReducerName].title) {
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
