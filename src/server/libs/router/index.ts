import * as Express from "express";
import getLogger from "../../utils/getLogger";
// import { getLogger } from "../../../iso/libs/utils/getLogger";

// const logger = getLogger("server/libs/router/index");
const logger = getLogger().getLogger("server/libs/router/index");

export class Router {
    protected router: Express.Router = Express.Router();
    
    public getRouter(): Express.Router {
        this.setRouter();
        return this.router;
    }

    /**
     * 用于注册Router
     */
    public setRouter() {
        // 用于注册Router
        logger.warn("未重载setRouter方法");
    }
}

export default Router;
