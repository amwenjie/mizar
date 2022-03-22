import Express from "express";
import state from "../state.js";
import getLogger from "../../utils/logger.js";
import Router from "./index.js";

// const logger = getLogger("server/libs/router/pageRouter");
const logger = getLogger().getLogger("server/libs/router/apiRouter");

function isFunction(fn) {
    return typeof fn === "function";
}

class ApiRouter extends Router {
    private apis = [];
    protected router: Express.Router = Express.Router();

    public constructor(apis) {
        super();
        this.apis = apis;
        this.setApiRouter(apis);
    }

    public setRouter() {
        logger.debug("apiRouters: ", this.apis);
        this.setApiRouter(this.apis).forEach(r => {
            this.router.use("/api", r);
        });
        this.router.use("/api", (req, res, next) => {
            logger.warn("api not found: ", req.path, req.query);
            res.status(404).end();
        });
    }

    private setApiRouter(apis) {
        const pathArr = Object.keys(apis);
        // .sort((p1, p2) => {
        //     return p1.length > p2.length ? -1 : (p1.length < p2.length ? 1 : 0);
        // });
        const routers = [];
        pathArr.forEach(path => {
            const childRouter = Express.Router();
            const apiHandlerMap = apis[path];
            if (isFunction(apiHandlerMap["get"])) {
                childRouter.get(path, apiHandlerMap["get"]);
                state.apis[path] = apiHandlerMap["get"];
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
                if (!state.apis[path]) {
                    state.apis[path] = apiHandlerMap["all"];
                }
            }
            routers.push(childRouter);
        });
        return routers;
    }
}

export default ApiRouter;
