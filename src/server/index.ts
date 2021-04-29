import * as BodyParser from "body-parser";
import * as Compression from "compression";
import * as CookieParser from "cookie-parser";
import * as Express from "express";
import * as Http from "http";
import * as Path from "path";
import * as ServeStatic from "serve-static";
import "source-map-support/register";
import { getPort } from "./util/getConfig";
import { getLogger } from "../iso/libs/utils/getLogger";
import setupExitSignals from "./util/setupExitSignals";

const logger = getLogger("server/index");

interface IBodyParserOption {
    raw?: boolean | BodyParser.Options;
    json?: boolean | BodyParser.OptionsJson;
    text?: boolean | BodyParser.OptionsText;
    urlencoded?: boolean | BodyParser.OptionsUrlencoded;
}
interface IStaticOption {
    path: string[];
    directory: string;
    staticOption?: ServeStatic.ServeStaticOptions
}
interface IWebServerOption {
    compress?: boolean;
    cookieParser?: boolean;
    bodyParser?: boolean | IBodyParserOption;
    headers?: string;
    middleware?: any;
    static?: IStaticOption[];
    onAfterSetupMiddleware?: () => void;
    onBeforeSetupMiddleware?: () => void;
    onServerClosed?: () => void;
}


const defautlOptions: IWebServerOption = {
    static: [],
};

export class WebServer {
    private options: any;
    private port: number = null;
    private router = null;

    protected name = "WebServer";

    public server: Http.Server;
    public app: Express.Express;

    constructor(options?: IWebServerOption) {
        this.options = Object.assign({}, defautlOptions, options);
        this.setupApp();
    }

    private setupApp() {
        this.app = Express();
    }

    private createServer() {
        // if (this.options.https) {
        // TODO: support https

        // if (this.options.http2) {
        //     // TODO: support http2
        //     this.server = require('spdy').createServer(
        //         {
        //             ...this.options.https,
        //             spdy: {
        //                 protocols: ['h2', 'http/1.1'],
        //             },
        //         },
        //         this.app
        //     );
        // } else {
        //     this.server = https.createServer(this.options.https, this.app);
        // }
        // } else {
        this.server = Http.createServer(this.app);
        // }

        this.server.on('error', (error) => {
            throw error;
        });
    }

    /**
     * 处理退出时的事件
     */
    // private setCloseHandle() {
    // process.once("SIGINT", () => {
    //     this.close();
    // });
    // }

    private ready() {
        this.setMiddleware();
        if (this.router !== null) {
            // 业务
            this.app.use(this.router.getRouter());
        }
        // this.app.set("port", this.port);
        this.setHealthCheck();
        this.errorEventHandler();

        this.createServer();
        setupExitSignals(this);
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
                this.close();
                reject(e);
            });
            this.server.on("listening", () => {
                logger.info("server starup successful, listen at port: " + this.port);
                resolve("");
            });
            this.server.listen({ port: this.port });
        });
    }

    /**
     * 中间件配置
     * 注意：执行顺序对应用的影响
     */
    private setMiddleware() {
        const features = {
            compress: () => {
                if (this.options.compress) {
                    this.setupCompressFeature()
                }
            },
            cookieParser: () => {
                if (this.options.cookieParser) {
                    this.setupCookieParserFeature();
                }
            },
            bodyParser: () => {
                if (this.options.bodyParser) {
                    this.setupBodyParserFeature();
                }
            },
            // proxy: () => {
            //     if (this.options.proxy) {
            //         this.setupProxyFeature();
            //     }
            // },
            static: () => {
                this.setupStaticFeature();
            },
            onBeforeSetupMiddleware: () => {
                if (typeof this.options.onBeforeSetupMiddleware === 'function') {
                    this.setupOnBeforeSetupMiddlewareFeature();
                }
            },
            onAfterSetupMiddleware: () => {
                if (typeof this.options.onAfterSetupMiddleware === 'function') {
                    this.setupOnAfterSetupMiddlewareFeature();
                }
            },
            middleware: () => {
                if (this.options.middleware) {
                    this.setupMiddleware();
                }
            },
            headers: () => {
                if (this.options.headers) {
                    this.setupHeadersFeature();
                }
            },
        };

        const runnableFeatures = [];

        // compress is placed last and uses unshift so that it will be the first middleware used
        if (this.options.compress) {
            runnableFeatures.push('compress');
        }

        if (this.options.onBeforeSetupMiddleware) {
            runnableFeatures.push('onBeforeSetupMiddleware');
        }

        if (this.options.cookieParser) {
            runnableFeatures.push('cookieParser');
        }

        if (this.options.bodyParser) {
            runnableFeatures.push('bodyParser');
        }

        if (this.options.headers) {
            runnableFeatures.push('headers');
        }

        // if (this.options.proxy) {
        //     runnableFeatures.push('proxy', 'middleware');
        // }

        if (this.options.static) {
            runnableFeatures.push('static');
        }

        if (this.options.middleware) {
            runnableFeatures.push('middleware');
        }

        // if (this.options.historyApiFallback) {
        //     runnableFeatures.push('historyApiFallback', 'middleware');

        //     if (this.options.static) {
        //         runnableFeatures.push('static');
        //     }
        // }

        // if (this.options.static) {
        //     runnableFeatures.push('staticServeIndex', 'staticWatch');
        // }

        // runnableFeatures.push('magicHtml');

        if (this.options.onAfterSetupMiddleware) {
            runnableFeatures.push('onAfterSetupMiddleware');
        }

        runnableFeatures.forEach((feature) => {
            features[feature]();
        });
    }

    private setupMiddleware() {
        const mws = Object.prototype.toString.call(this.options.middleware) === "[object Array]"
            ? this.options.middleware : [this.options.middleware];
        mws.forEach(mw => {
            this.app.use(mw);
        });
    }

    private setupCompressFeature() {
        this.app.use(Compression());
    }

    private setupCookieParserFeature() {
        this.app.use(CookieParser());
    }

    private setupBodyParserFeature() {
        const bodyParserOpt = {
            limit: 10 * 1024 * 1024,
        };
        let rawOpt = {
            ...bodyParserOpt,
        };
        let jsonOpt = {
            ...bodyParserOpt,
        };
        let textOpt = {
            ...bodyParserOpt,
        };
        let urlencodedOpt = {
            ...bodyParserOpt,
            extended: true,
        };
        if (Object.prototype.toString.call(this.options.bodyParser) === "[object Object]") {
            if (Object.prototype.toString.call(this.options.bodyParser.raw) === "[object Object]") {
                rawOpt = this.options.bodyParser.raw;
            }
            if (Object.prototype.toString.call(this.options.bodyParser.json) === "[object Object]") {
                jsonOpt = this.options.bodyParser.json;
            }
            if (Object.prototype.toString.call(this.options.bodyParser.text) === "[object Object]") {
                textOpt = this.options.bodyParser.text;
            }
            if (Object.prototype.toString.call(this.options.bodyParser.urlencoded) === "[object Object]") {
                urlencodedOpt = this.options.bodyParser.urlencoded;
            }
        }
        if (typeof this.options.bodyParser === "boolean") {
            this.app.use(Express.raw(rawOpt));
            this.app.use(Express.json(jsonOpt));
            this.app.use(Express.text(textOpt));
            this.app.use(Express.urlencoded(urlencodedOpt));
        } else {
            if (this.options.bodyParser.raw) {
                this.app.use(Express.raw(rawOpt));
            }
            if (this.options.bodyParser.json) {
                this.app.use(Express.json(jsonOpt));
            }
            if (this.options.bodyParser.text) {
                this.app.use(Express.text(textOpt));
            }
            if (this.options.bodyParser.urlencoded) {
                this.app.use(Express.urlencoded(urlencodedOpt));
            }
        }
    }

    private setupOnBeforeSetupMiddlewareFeature() {
        this.options.onBeforeSetupMiddleware(this);
    }

    private setupOnAfterSetupMiddlewareFeature() {
        this.options.onAfterSetupMiddleware(this);
    }

    private setupHeadersFeature() {
        this.app.all('*', this.setContentHeaders.bind(this));
    }

    private setContentHeaders(req, res, next) {
        for (const name in this.options.headers) {
            res.setHeader(name, this.options.headers[name]);
        }
        next();
    }

    private setupStaticFeature() {
        this.options.static.forEach(staticOption => {
            staticOption.path.forEach(path => {
                this.app.use(
                    path,
                    Express.static(staticOption.directory, staticOption.staticOptions)
                );
            });
        });
    }

    // private setupStaticServeIndexFeature() {
    //     this.options.static.forEach((staticOption) => {
    //         staticOption.publicPath.forEach((publicPath) => {
    //             if (staticOption.serveIndex) {
    //                 this.app.use(publicPath, (req, res, next) => {
    //                     // serve-index doesn't fallthrough non-get/head request to next middleware
    //                     if (req.method !== 'GET' && req.method !== 'HEAD') {
    //                         return next();
    //                     }

    //                     serveIndex(staticOption.directory, staticOption.serveIndex)(
    //                         req,
    //                         res,
    //                         next
    //                     );
    //                 });
    //             }
    //         });
    //     });
    // }

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
        // this.setCloseHandle();
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
     * 关闭该web服务器
     */
    public close(cb?: () => void) {
        this.server.close(() => {
            logger.warn(this.name, "close", "port", this.port);
            if (typeof this.options.onServerClosed === "function") {
                this.options.onServerClosed();
            }
            if (typeof cb === "function") {
                cb();
            }
        });
    }

    public setStatic(staticRootPath, staticOption = {}) {
        logger.info("setStatic recieve staticRootPath: ", staticRootPath);
        if (Object.prototype.toString.call(this.options.static) !== "[object Array]") {
            this.options.static = [];
        }
        const path = staticRootPath.replace(/\/$/, "");
        const directory = Path.resolve(staticRootPath.replace(/^\//, ""));
        logger.info("static path : ", path);
        logger.info("static directory : ", directory);
        this.options.static.push({
            path: [path],
            directory: directory,
            staticOption,
        });
        return this;
    }

    /**
     * bootstrap before
     */
    protected async bootstrapAsyncBefore() {
        //
    }
}

export default WebServer;
