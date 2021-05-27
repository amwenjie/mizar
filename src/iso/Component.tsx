import * as React from "react";
import { History, Location } from "history";
import { match } from "react-router";
import isServer from "./utils/isServer";

export const RouteContext: {
    history?: History;
    location?: Location;
    match?: match
} = {};

class Component<P, S, SS = any> extends React.Component<P, S, SS> {
    constructor(props) {
        super(props);
        if (!isServer && props) {
            if (props.history) {
                RouteContext.history = props.history;
            }
            if (props.location) {
                RouteContext.location = props.location;
            }
            if (props.match) {
                RouteContext.match = props.match;
            }
        }
    }
}

export default Component;

export const ReactComponent = React.Component;
export const ReactPureComponent = React.PureComponent;
