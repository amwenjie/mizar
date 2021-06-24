import React from "react";
import { connect } from "../../../connect";
import { hideLoading as loadingHideAction, showLoading as loadingShowAction } from "../Loading/actions";
import getLoading from "../Loading";
import { IProps } from "./interfaces";
import reducer from "./reducer";
import * as style from "./index.css";

const loadingId = "common.fetch.loading";
const Loading = getLoading(loadingId);

class FetchLoading extends React.Component<IProps, {}> {
    public render() {
        if (this.props.showLoading) {
            this.props.dispatch(loadingShowAction(loadingId));
        } else {
            this.props.dispatch(loadingHideAction(loadingId));
        }
        return (
            this.props.showLoading ?
                <div className={(style as any).loading}>
                    <Loading />
                </div>
                : null
        );
    }
}

export const getReducerName = (id) => {
    return id + "common.fetch.loading";
};

export default function (id) {
    return connect()(reducer(id), getReducerName(id))(FetchLoading);
};