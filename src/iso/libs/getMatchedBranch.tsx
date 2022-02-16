import React from "react";
import { matchRoutes } from "react-router-dom";
import { IPageRouter } from "../../interface";

function checkElementIsLoadable(element): boolean {
    if (element
        && typeof element.type === "function"
        // && element.type.name === "LoadableComponent"
        && (element.type as any).preload
    ) {
        return true;
    }
    return false;
}

export default async function (pageRouter: IPageRouter[], path: string) {
    const branch = matchRoutes(pageRouter, path);
    let matched = null;
    if (branch) {
        matched = branch[branch.length - 1];
        if (matched.route
            && matched.route.element
            && checkElementIsLoadable(matched.route.element)
        ) {
            const compMap = {};
            compMap[(matched.route as IPageRouter).name] = (await ((matched.route.element as any).type as any).preload()).default;
            const TrueCom = compMap[(matched.route as IPageRouter).name];
            matched.route.element = (<TrueCom />);
        }
    }
    return matched;
}