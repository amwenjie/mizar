import Express from "express";
import getLogger from "../../utils/logger.js";
const logger = getLogger().getLogger("server/libs/router/index");

class Router {
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
