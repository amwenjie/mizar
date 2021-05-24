import * as Express from "express";
import getLogger from "../../utils/getLogger";
import Router from "./index";

// const logger = getLogger("server/libs/router/pageRouter");
const logger = getLogger().getLogger("server/libs/router/apiRouter");

export default class ApiRouter extends Router {
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
            if (apis[path]["get"]) {
                childRouter.get(path, apis[path]["get"]);
            }
            if (apis[path]["post"]) {
                childRouter.post(path, apis[path]["post"]);
            }
            if (apis[path]["put"]) {
                childRouter.put(path, apis[path]["put"]);
            }
            if (apis[path]["delete"]) {
                childRouter.delete(path, apis[path]["delete"]);
            }
            if (apis[path]["all"]) {
                childRouter.all(path, apis[path]["all"]);
            }
            routers.push(childRouter);
        });
        return routers;
    }
}
