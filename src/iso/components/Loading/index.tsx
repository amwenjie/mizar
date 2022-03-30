import React from "react";
import { connect } from "../../connect.js";
import { IProps } from "./interface.js";
import reducer from "./reducer.js";
import * as style from "./index.css";

export function Loading(props: IProps) {
    if (props.showLoading) {
        if (props.content) {
            if (typeof props.content === "string") {
                // 是一个gif图
                return (<img className={(style as any).loading} src={props.content} />);
            } else if (props.content) {
                // 是一个react组件实例，调用者自己实现了loading效果
                const CuzLoading = props.content;
                return <CuzLoading />;
            }
        } else {
            // 默认使用纯CSS3实现，以便达到最好的加载速度
            return (<div className={`${(style as any).loading} ${(style as any).css}`} />);
        }
    }
    return null;
}

export const getReducerName = (id: string) => {
    return id + ".common.loading";
};

export default function (id: string) {
    return connect()(Loading, reducer(id), getReducerName(id));
}
