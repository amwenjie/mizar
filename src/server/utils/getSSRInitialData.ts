import type { Request } from "express";
import { getInitialData } from "../../iso/libs/metaCollector.js";
import type { IInitialRenderData, IMatchedRouteCom } from "../../interface.js";

export default async function getSSRInitialData(matchedPageCom: IMatchedRouteCom , req: Request): Promise<IInitialRenderData> {
    const initialData = await getInitialData(matchedPageCom, req);
    let preloadData: unknown = {};
    let pageReducerName = "";
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
