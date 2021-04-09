import { getLogger } from "./libs/utils/getLogger";
const logger = getLogger("iso.asyncAction")

export default actionFn => (...args) => async dispatch => {
    try {
        const bizAction = await actionFn(...args);
        dispatch(bizAction);
    } catch (e) {
        logger.error("actionFn produce an error: ", e);
    }
};