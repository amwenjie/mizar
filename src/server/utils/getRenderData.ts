import * as metaCollector from "../../iso/libs/metaCollector";
import getCombinedState from "../../iso/utils/getCombinedState";
import { frameworkId } from "../../config";

async function getSSRInitialData(matchedBranch, req): Promise<{preloadData: any, pageReducerName: string}> {
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
    };
}

export default async function getRenderData(matchedBranch, req): Promise<{preloadData: any, pageReducerName: string}> {
    const { preloadData, pageReducerName } = await getSSRInitialData(matchedBranch, req);
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
    };
}