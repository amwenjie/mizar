import * as constants from "./constants";

export function showLoading(id = "") {
    return {
        type: id + constants.showLoading,
    };
}

export function hideLoading(id = "") {
    return {
        type: id + constants.hideLoading,
    };
}
