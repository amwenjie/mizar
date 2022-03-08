import state from "./state";
import getLogger from "../utils/logger";
import { match, MatchResult } from "path-to-regexp";

const logger = getLogger().getLogger("server/libs/apiController");

function getMatchedApiPath(path: string): {
    apiPath: string,
    params: any | undefined
} | null {
    const pathArr: string[] = Object.keys(state.apis);
    for (let i = 0, len = pathArr.length; i < len; i++) {
        const p = pathArr[i];
        const matched = match(p, {
            decode: decodeURIComponent,
            encode: encodeURI,
        })(path);
        const isMatched = matched !== false;
        if (isMatched) {
            return {
                apiPath: p,
                params: (matched as MatchResult).params,
            };
        }
    }
    return null;
}

export default async (req, res, next = logger.error) => {
    logger.info("api req.path", req.path);
    logger.info("api req.body", req.body);
    logger.info("api req.query", req.query);
    let apiPath = req.path; // .replace(/^\//, "");
    // 根据path找到并调用对应的api方法
    // apiPath期望的形式: path/method
    if (!/^(?:\/[A-Za-z][A-Za-z0-9]*?)+$/.test(apiPath)) {
        // 不合法的api请求，交给错误中间件兜底
        next(new Error("不合法的API请求: " + apiPath));
        return;
    }
    const matched = getMatchedApiPath(apiPath);
    if (matched) {
        req.params = {
            ...matched.params
        };
        apiPath = matched.apiPath;
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
