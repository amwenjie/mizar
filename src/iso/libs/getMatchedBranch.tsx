import { matchRoutes } from "react-router-dom";
import { IPageRouter } from "../../interface";

export function checkElementIsLoadable(element): boolean {
    if (element && typeof element.preload === "function" && typeof element.load === "function") {
        return true;
    }
    return false;
}

export async function loadLoadableElement(element): Promise<JSX.Element|null> {
    let RealCom;
    if (checkElementIsLoadable(element)) {
        RealCom = await element.load();
        return RealCom;
    }
    return element;
}

export default async function (pageRouter: IPageRouter[], path: string) {
    const branch = matchRoutes(pageRouter, path);
    let matched = null;
    if (branch) {
        matched = branch[branch.length - 1];
        // if (matched.route && matched.route.element) {
        //     const RealCom = await loadLoadableElement(matched.route.element);
        //     if (RealCom) {
        //         matched.route.element = RealCom;
        //     }
        // }
    }
    return matched;
}