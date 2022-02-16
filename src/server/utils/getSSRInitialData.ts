import { type Request } from "express";
import { getInitialData } from "../../iso/libs/metaCollector";
import { IInitialRenderData } from "../../interface";
import { RouteMatch } from "react-router-dom";

export default async function getSSRInitialData(matchedRoute: RouteMatch, req: Request): Promise<IInitialRenderData> {
    const initialData = await getInitialData(matchedRoute, req);
    let preloadData: any = {};
    let pageReducerName: string = "";
    if (initialData.preloadData) {
        preloadData = initialData.preloadData;
    }
    if (initialData.pageReducerName) {
        pageReducerName = initialData.pageReducerName;
    }
    return {
        preloadData,
        pageReducerName,
        pageComName: initialData.pageComName,
    };
}
