import React from "react";
import { connect } from "../../../connect";
import CycleImage from "./components/CycleImage";
import { IProps } from "./interfaces";
import reducer from "./reducer";
import * as style from "./index.css";

class Loading extends React.Component<IProps, {}> {
    // private style = require("./main.css");

    public render() {
        return (
            this.props.showLoading ?
                <this.LoadingContent
                    content={this.props.content}
                    interval={this.props.interval}
                    width={this.props.width}
                    height={this.props.height}
                />
                : null
        );
    }

    private LoadingContent = (props) => {
        if (props.content) {
            if (typeof props.content === "string") {
                // 是一个gif图
                return <img className={(style as any).imgLoading} src={props.content} />;
            } else if (Object.prototype.toString.call(props.content) === "[object Array]") {
                // 是静态图片数组，采用图片轮播的形式显示loading，效率最差
                return <CycleImage images={props.conent} interval={500} width={props.width} height={props.height} />;
            } else if (props.content instanceof React.Component) {
                // 是一个react组件实例，调用者自己实现了loading效果
                return props.content;
            }
        } else {
            // 默认使用纯CSS3实现，以便达到最好的加载速度
            return (<div className={(style as any).cssLoading} />);
        }
    }
}

export const getReducerName = (id) => {
    return id + "common.loading";
};

export const getLoading = (id) => {
    return connect()(reducer(id), getReducerName(id))(Loading);
};
export default getLoading;
