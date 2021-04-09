import * as BodyParser from "body-parser";
import * as Compression from "compression";
import * as CookieParser from "cookie-parser";
import * as Express from "express";
import * as Http from "http";
import * as net from "net";
import * as Path from "path";
import "source-map-support/register";
import { getPort } from "./util/getConfig";
import { getLogger } from "../iso/libs/utils/getLogger";

const logger = getLogger("server/index");

export class WebServer {
    public server: net.Server;
    public app: Express.Express;
    protected name = "WebServer";
    private port: number = null;
    private router = null;
    private staticRootPath = null;
    private staticOptions = null;
    private middlewares = null;

    constructor() {
        this.app = Express();
        this.server = Http.createServer(this.app);
        this.staticOptions = {};
        this.middlewares = [
            Compression(),
            CookieParser(),
            BodyParser.json(),
            BodyParser.urlencoded({
                limit: 10 * 1024 * 1024,
                extended: true,
            })
        ];
    }
    /**
     * 手动指定端口号
     * @param port 端口号
     */
    public setPort(port: number) {
        if (isNaN(Number(port)) || port === 0) {
            throw new Error([
                "WebServer.setPort illegal port: ",
                port,
                ",请检查package.json customConfig.port是否配置，或当前未处在项目目录下"
            ].join(''));
        }
        this.port = port;
        return this;
    }

    /**
     * 启动Web服务器
     */
    public async bootstrapAsync() {
        await this.bootstrapAsyncBefore();
        const port = getPort();
        this.setPort(port);
        // this.app.set("view engine", "ejs");
        // this.app.set("views", Path.resolve("view"));
        // this.setStatic(Path.resolve("client"));
        this.setCloseHandle();
        this.ready();
        await this.startup();
        logger.info(this.name, "bootstrapAsync", "port", this.port);
        return this;
    }
    /**
     * 挂载该Web服务器的router点
     * @param router
     */
    public setRouter(router) {
        this.router = router;
        return this;
    }
    /**
     * 配置其它自定义中间件
     * @param {Express.RequestHandler | Express.ErrorRequestHandler | Express.NextFunction | any} handler
     */
    public useMiddleware(handler: Express.RequestHandler | Express.ErrorRequestHandler | Express.NextFunction | any) {
        // this.app.use(handler);
        if (Object.prototype.toString.call(handler) === "[object Array]") {
            this.middlewares = handler;
        } else {
            this.middlewares.push(handler);
        }
        return this;
    }
    /**
     * 关闭该web服务器
     */
    public close() {
        console.warn(this.name, "close", "port", this.port);
    }

    public setStatic(staticRootPath, staticOptions = {}) {
        console.info("setStatic recieve staticRootPath: ", staticRootPath);
        this.staticRootPath = staticRootPath;
        this.staticOptions = staticOptions;
        return this;
    }

    /**
     * bootstrap before
     */
    protected async bootstrapAsyncBefore() {
        //
    }
    /**
     * 处理退出时的事件
     */
    private setCloseHandle() {
        process.once("SIGINT", () => {
            this.close();
        });
    }
    
    private ready() {
        // this.app.set("port", this.port);
        this.errorEventHandler();
        this.setMiddleware();
        return this;
    }

    private setHealthCheck() {
        this.app.get("/status", (req, res) => {
            // 监控程序通过访问 /status https的状态码为200来判断服务是否健康
            res.send("OK");
        });
    }

    /**
     * 异常事件注册
     */
    private errorEventHandler() {
        process.on("uncaughtException", (error) => {
            logger.error(this.name, "errorEventHandler",
                "UNCAUGHT_EXCEPTION", "!!!未处理的严重异常.被process.uncaughtException捕获!!!", error);
        });
    }

    private async startup() {
        return new Promise((resolve, reject) => {
            this.server.on("error", e => {
                logger.error("server start error, please retry", e);
                this.server.close();
                reject(e);
            });
            this.server.on("listening", () => {
                resolve("server starup successful, listen at port:" + this.port);
            });
            this.server.listen({port: this.port});
        });
    }
    /**
     * 中间件配置
     * 注意：执行顺序对应用的影响
     */
    private setMiddleware() {
        this.middlewares.forEach(item => {
            this.app.use(item);
        });
        // this.app.use(Compression());
        // this.app.use(CookieParser());
        // this.app.use(BodyParser.json());
        // this.app.use(BodyParser.urlencoded({
        //     limit: 10 * 1024 * 1024,
        //     extended: true,
        // }));
        if (this.staticRootPath !== null) {
            const staticRoute = this.staticRootPath.replace(/\/$/, "");
            const staticRoot = Path.resolve(this.staticRootPath.replace(/^\//, ""));
            logger.info("static route : ", staticRoute);
            logger.info("static root : ", staticRoot);
            this.app.use(staticRoute, Express.static(staticRoot, this.staticOptions));
        }
        this.setHealthCheck();
        if (this.router !== null) {
            // 业务
            this.app.use(this.router.getRouter());
        }
    }
}

export default WebServer;
