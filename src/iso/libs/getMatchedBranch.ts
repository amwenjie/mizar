import { matchRoutes, RouteConfig } from "react-router-config";

export default async function (pageRouter: RouteConfig[], path: string) {
    const branch = matchRoutes(pageRouter, path);
    if (branch[0]
        && branch[0].route
        && branch[0].route.component
        && (branch[0].route.component as any).preload) {
        branch[0].route.component =
            (await (branch[0].route.component as any).preload()).default;
    }
    return branch;
}