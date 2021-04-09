import * as Express from "express";

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
        console.warn("未重载setRouter方法");
    }
}

export default Router;
