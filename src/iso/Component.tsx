import React from "react";

declare const IS_SERVER_RUNTIME;
class Component<P, S, SS = any> extends React.Component<P, S, SS> {
    constructor(props) {
        super(props);
    }
}

export function importReqAuthCom(comPath, condition) {
    if (IS_SERVER_RUNTIME) {

    } else {
        
        const fetch = require("../iso/fetch").default;
        
        fetch({
            noLoading: true,
            method: "post",
            url: "/api/getReqAuthCom",
            data: {
                condition,
                comPath,
            },
        });
    }
}

export default Component;