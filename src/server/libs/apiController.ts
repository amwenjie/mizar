import { match, MatchResult } from "path-to-regexp";
import state from "./state.js";
import getLogger from "../utils/logger.js";

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

export default async (req, res) => {
    logger.info("api req.path", req.path);
    logger.info("api req.body", req.body);
    logger.info("api req.query", req.query);
    const method = req.method;
    let apiPath = req.path; // .replace(/^\//, "");
    // 根据path找到并调用对应的api方法
    // apiPath期望的形式: path/method
    if (!/^(?:\/[A-Za-z][A-Za-z0-9]*?)+$/.test(apiPath)) {
        res.status(404).end();
        logger.warn("不合法的API请求: " + apiPath);
        return;
    }
    const matched = getMatchedApiPath(apiPath);
    if (matched) {
        req.params = {
            ...matched.params
        };
        apiPath = matched.apiPath;
    }
    const apiMap = state.apis[apiPath];
    const api = apiMap ? (apiMap[method] || apiMap.all) : null;
    if (typeof api !== "function") {
        res.status(404).end();
        logger.warn("服务端请求的API不存在: " + apiPath);
        return;
    }
    try {
        await api(req, res);
    } catch (e) {
        logger.error("api execute error : " + apiPath, e);
        res.status(500).end();
    }
};
