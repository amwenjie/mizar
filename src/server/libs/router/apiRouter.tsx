import Express from "express";
import isFunction from "../../../iso/utils/isFunction.js";
import getLogger from "../../utils/logger.js";
import state from "../state.js";
import Router from "./index.js";

// const logger = getLogger("server/libs/router/pageRouter");
const logger = getLogger().getLogger("server/libs/router/apiRouter");

class ApiRouter extends Router {
    protected router: Express.Router = Express.Router();

    public constructor() {
        super();
        this.setApiRouter();
    }

    public setRouter() {
        this.setApiRouter().forEach(r => {
            this.router.use("/api", r);
        });
        this.router.use("/api", (req, res, next) => {
            logger.warn("client request api not exist: ", req.path, req.query);
            res.status(404).end();
        });
    }

    private setApiRouter() {
        const pathArr = Object.keys(state.apis);
        // .sort((p1, p2) => {
        //     return p1.length > p2.length ? -1 : (p1.length < p2.length ? 1 : 0);
        // });
        const routers = [];
        for (let i = 0, len = pathArr.length; i < len; i++) {
            const path = pathArr[i];
            const apiHandlerMap = state.apis[path];
            if (!apiHandlerMap) {
                continue;
            }
            const childRouter = Express.Router();
            if (isFunction(apiHandlerMap["get"])) {
                childRouter.get(path, apiHandlerMap["get"]);
            }
            if (isFunction(apiHandlerMap["post"])) {
                childRouter.post(path, apiHandlerMap["post"]);
            }
            if (isFunction(apiHandlerMap["put"])) {
                childRouter.put(path, apiHandlerMap["put"]);
            }
            if (isFunction(apiHandlerMap["delete"])) {
                childRouter.delete(path, apiHandlerMap["delete"]);
            }
            if (isFunction(apiHandlerMap["all"])) {
                childRouter.all(path, apiHandlerMap["all"]);
            }
            routers.push(childRouter);
        }
        return routers;
    }
}

export default ApiRouter;
