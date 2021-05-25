import state from "../../iso/libs/state";
import getLogger from "../utils/getLogger";
import { pathToRegexp, match, parse, compile, MatchResult } from "path-to-regexp";

// import { getLogger } from "../../iso/utils/getLogger";

// const logger = getLogger("server/libs/apiController");

const logger = getLogger().getLogger("server/libs/apiController");

export default async (req, res, next = logger.error) => {
    logger.info("api req.path", req.path);
    logger.info("api req.params", req.body);
    logger.info("api req.query", req.query);
    const path = req.path; // .replace(/^\//, "");
    // 根据path找到并调用对应的api方法
    // apiPath期望的形式: path/method
    if (!/^\/([A-Za-z]+(\/[A-Za-z]*)*)+$/.test(path)) {
        // 不合法的api请求，交给错误中间件兜底
        next(new Error("不合法的API请求: " + path));
        return;
    }
    let apiPath: string;
    const pathArr: string[] = Object.keys(state.apis);
    for (let i = 0, len = pathArr.length; i < len; i++) {
        const p = pathArr[i];
        const matched = match(p, {
            decode: decodeURIComponent,
            encode: encodeURI,
        })(path);
        const isMatched = matched !== false;
        if (isMatched) {
            apiPath = p;
            req.params = (matched as MatchResult).params;
            break;
        }
    }
    if (!apiPath) {
        // const api = state.apis[apiPath];
        // if (typeof api !== "function") {
        next(new Error("该API不存在: " + apiPath));
        return;
    }
    const api = state.apis[apiPath];
    try {
        await api(req, res);
    } catch (e) {
        next(e);
    }
};
