import React from "react";

declare const IS_SERVER_RUNTIME;
class Component<P, S, SS = any> extends React.Component<P, S, SS> {
    constructor(props) {
        super(props);
    }
}

export default Component;