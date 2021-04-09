import * as constants from "./constants";
import initialState from "./initialState";

export default (id) => {
    return (state = initialState, action) => {
        if (action.type === (id + constants.showLoading)) {
            return { ...state, showLoading: true };
        } else if (action.type === (id + constants.hideLoading)) {
            return { ...state, showLoading: false };
        }
        return state;
    };
};
