import * as metaCollector from "../../iso/libs/metaCollector";
import { IInitialRenderData } from "../../interface";

export default async function getSSRInitialData(matchedBranch, req): Promise<IInitialRenderData> {
    const initialData = await metaCollector.getInitialData(matchedBranch, req);
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
