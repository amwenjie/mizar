import { hideLoading, showLoading } from "./constants.js";
import initialState from "./initialState.js";

export default (id: string) => {
    return (state = initialState, action) => {
        if (action.type === (id + showLoading)) {
            return { ...state, showLoading: true };
        } else if (action.type === (id + hideLoading)) {
            return { ...state, showLoading: false };
        }
        return state;
    };
};
