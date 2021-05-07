import getLogger from "./utils/getLogger";
const logger = getLogger().getLogger("iso/asyncAction");

export default actionFn => (...args) => async dispatch => {
    try {
        const bizAction = await actionFn(...args);
        dispatch(bizAction);
    } catch (e) {
        logger.error("actionFn produce an error: ", e);
    }
};