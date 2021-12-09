import React from "react";
import { matchRoutes } from "react-router-dom";
import { IPageRouter } from "../../interface";

function checkElementIsLoadable (element): boolean {
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
    if (branch
        && branch[0].route
        && branch[0].route.element
        && checkElementIsLoadable(branch[0].route.element)
    ) {
        const compMap = {};
        compMap[(branch[0].route as IPageRouter).name] = (await ((branch[0].route.element as any).type as any).preload()).default;
        const TrueCom = compMap[(branch[0].route as IPageRouter).name];
        branch[0].route.element = <TrueCom />
    }
    return branch;
}