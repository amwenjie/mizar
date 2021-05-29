export default function (state, actionData) {
    if (state.data && typeof state.data === "object") { // 说明是对象或数组
        const data = {
            ...state.data,
            ...actionData.data,
        };
        return {
            ...state,
            ...actionData,
            data: {
                ...data,
            },
        };
    }
    return {
        ...state,
        ...actionData,
    };
}