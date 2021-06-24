import { hideLoading, showLoading } from "./constants";
import initialState from "./initialState";

export default (id) => {
    return (state = initialState, action) => {
        if (action.type === (id + showLoading)) {
            return { ...state, showLoading: true };
        } else if (action.type === (id + hideLoading)) {
            return { ...state, showLoading: false };
        }
        return state;
    };
};
