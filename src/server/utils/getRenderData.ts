import * as metaCollector from "../../iso/libs/metaCollector";
import getCombinedState from "../../iso/utils/getCombinedState";
import { frameworkId } from "../../config";
import { IInitialRenderData } from "../../interface";

async function getSSRInitialData(matchedBranch, req): Promise<IInitialRenderData> {
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

export default async function getRenderData(matchedBranch, req): Promise<IInitialRenderData> {
    const { preloadData, pageReducerName, pageComName } = await getSSRInitialData(matchedBranch, req);
    const initialState: any = metaCollector.getRootReducer()(undefined, {
        type: frameworkId
    }) || {};
    Object.keys(preloadData).forEach(reducerName => {
        if (reducerName in initialState) {
            initialState[reducerName] = getCombinedState(
                initialState[reducerName],
                preloadData[reducerName]
            );
        } else {
            initialState[reducerName] = preloadData;
        }
    });
    return {
        preloadData: initialState,
        pageReducerName,
        pageComName,
    };
}