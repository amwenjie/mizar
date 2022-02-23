import { type Request } from "express";
import { getInitialData } from "../../iso/libs/metaCollector";
import { IInitialRenderData } from "../../interface";

export default async function getSSRInitialData(matchedPageCom, req: Request): Promise<IInitialRenderData> {
    const initialData = await getInitialData(matchedPageCom, req);
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
