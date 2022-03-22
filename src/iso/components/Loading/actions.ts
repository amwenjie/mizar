import { hideLoading as vHideLoading, showLoading as vShowLoading } from "./constants.js";

export function showLoading(id = "") {
    return {
        type: id + vShowLoading,
    };
}

export function hideLoading(id = "") {
    return {
        type: id + vHideLoading,
    };
}
