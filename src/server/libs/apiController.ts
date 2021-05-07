import state from "../../iso/libs/state";
import getLogger from "../utils/getLogger";

// import { getLogger } from "../../iso/utils/getLogger";

// const logger = getLogger("server/libs/apiController");

const logger = getLogger().getLogger("server/libs/apiController");

export default async (req, res, next = logger.error) => {
    logger.info("api req.path", req.path);
    const apiPath = req.path.replace(/^\//, "");
    const params = req.params;
    // 根据path找到并调用对应的api方法
    // apiPath期望的形式: path/method
    if (!/^([A-Za-z]+(\/[A-Za-z]*)*)+$/.test(apiPath)) {
        // 不合法的api请求，交给错误中间件兜底
        next(new Error("不合法的API请求: " + apiPath));
        return;
    }
    const api = state.apis[apiPath];
    if (typeof api !== "function") {
        next(new Error("该API不存在: " + apiPath));
        return;
    }
    try {
        await api(req, res);
    } catch (e) {
        next(e);
    }
};
