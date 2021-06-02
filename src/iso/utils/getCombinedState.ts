export default function (state, actionData) {
    if (actionData.data) {
        if (typeof actionData.data === "object" && !(actionData.data instanceof Array)) {
            if (state.data && typeof state.data === "object" && !(state.data instanceof Array)) {
                return {
                    ...state,
                    ...actionData,
                    data: {
                        ...state.data,
                        ...actionData.data,
                    },
                };
            }
        }
    }
    return {
        ...state,
        ...actionData,
    };
}