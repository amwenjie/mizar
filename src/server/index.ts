import BodyParser from "body-parser";
import Compression from "compression";
import CookieParser from "cookie-parser";
import cors, { type CorsOptions, type CorsOptionsDelegate } from "cors";
import crypto from "crypto";
import Express from "express";
import helmet, { type HelmetOptions } from "helmet";
import * as Http from "http";
import { createProxyMiddleware, Options as ProxyOptions } from "http-proxy-middleware";
import * as net from "net";
import internalIp from "internal-ip";
import Path from "path";
import ServeStatic from "serve-static";
import { URL } from "url";
import { getPort, getPublicPath } from "./utils/getConfig.js";
import getLogger from "./utils/logger.js";
import setupExitSignals from "./utils/setupExitSignals.js";
import checkPositivePath from "./utils/checkPositivePath.js";

declare const IS_DEBUG_MODE;
declare const DEV_PROXY_CONFIG;

const protocalPortMap = {
    "ftp:": 21,
    "http:": 80,
    "https:": 443,
    "ws:": 80,
    "wss:": 443,
};

// if (IS_DEBUG_MODE) {
//     (await import("source-map-support")).install();
// }

interface IBodyParserOption {
    raw?: boolean | BodyParser.Options;
    json?: boolean | BodyParser.OptionsJson;
    text?: boolean | BodyParser.OptionsText;
    urlencoded?: boolean | BodyParser.OptionsUrlencoded;
}
interface IStaticOption {
    path: string[];
    directory: string;
    staticOption?: ServeStatic.ServeStaticOptions;
    isInternal?: true;
}
interface IServerProxyRouter {
    [path: string]: string;
}

interface IProxyConfig extends ProxyOptions {
    changeOriginReferer?: boolean;
}

interface IServerProxyOption {
    path: string;
    config: IProxyConfig
}

interface ISingleRouteCorsOption {
    path: string;
    corsOptions: CorsOptions | CorsOptionsDelegate;
}

interface IWebServerOption {
    access?: any;
    compress?: boolean;
    cookieParser?: boolean;
    bodyParser?: boolean | IBodyParserOption;
    headers?: string;
    hostname?: "local-ip" | "local-ipv4" | "local-ipv6";
    port?: number;
    proxy?: string | IServerProxyRouter | IServerProxyOption[];
    middleware?: any;
    static?: IStaticOption[];
    secureHeaderOptions?: HelmetOptions | false;
    corsOptions?: CorsOptions | CorsOptionsDelegate | ISingleRouteCorsOption[];
    onServerClosed?: () => void;
    onListening?: (server: net.Server) => void;
}

const logger = getLogger();
// const log = getLogger("server/index");

const log = logger.getLogger("server/index");

class WebServer {
    private state = false;
    private options: any;
    private routers: (Express.RequestHandler | Express.ErrorRequestHandler)[];

    protected name = "WebServer";

    public server: net.Server;
    public app: Express.Express;

    constructor(options?: IWebServerOption) {
        const defaultPort = getPort();
        if ((!options || !options.port) && !defaultPort) {
            throw new Error("no port specified");
        }
        const defautlOptions: IWebServerOption = {
            port: getPort(),
        };
        this.options = {
            ...defautlOptions,
            ...options,
        };
        this.setupApp();
        this.setHealthCheck();
        this.errorEventHandler();
        this.createServer();
        setupExitSignals(this);
    }

    private checkServerStarted(): boolean {
        if (this.state) {
            log.warn("server started, can not bootstrap or set router");
        }
        return this.state;
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
        this.server.on("error", e => {
            log.error("server start error, please retry", e);
            this.close();
            throw new Error("server start error, please retry. " + e.message);
        });
        this.server.on("listening", () => {
            this.state = true;
            console.log("server start successful, listening at port: " + this.options.port);
            if (typeof this.options.onListening === "function") {
                this.options.onListening(this.server);
            }
        });
    }

    private getInteralStatic(staticOption = {}) {
        const staticRootPath = getPublicPath();
        log.info("setStatic recieve staticRootPath: ", staticRootPath);
        const path = staticRootPath.replace(/\/$/, "");
        const directory = Path.resolve(staticRootPath.replace(/^\//, ""));
        log.info("static path : ", path);
        log.info("static directory : ", directory);
        return {
            path: [path],
            directory: directory,
            staticOption,
        };
    }

    /**
     * 处理退出时的事件
     */
    // private setCloseHandle() {
    // process.once("SIGINT", () => {
    //     this.close();
    // });
    // }

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
            log.error(this.name, "errorEventHandler",
                "UNCAUGHT_EXCEPTION", "!!!未处理的严重异常.被process.uncaughtException捕获!!!", error);
        });
    }

    private async listen(port, hostname?: string) {
        return new Promise(async (resolve, reject) => {
            try {
                if (hostname === "local-ip") {
                    hostname = await internalIp.v4() || await internalIp.v6() || "0.0.0.0";
                } else if (hostname === "local-ipv4") {
                    hostname = await internalIp.v4() || "0.0.0.0";
                } else if (hostname === 'local-ipv6') {
                    hostname = await internalIp.v6() || '::';
                }
                this.server.listen({
                    port: port,
                    host: hostname,
                });
                resolve("");
            } catch (e) {
                reject(e);
            }
        });
    }

    private setRouter() {
        if (this.routers) {
            this.routers.forEach(router => this.app.use(router));
        }
    }

    /**
     * 中间件配置
     * 注意：执行顺序对应用的影响
     */
    private setMiddleware() {
        const features = {
            helmet: () => {
                this.setupHelmetFeature();
            },
            cors: () => {
                this.setupCorsFeature();
            },
            access: () => {
                this.setupAccessFeature();
            },
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
            proxy: () => {
                if (this.options.proxy) {
                    this.setupProxyFeature();
                }
            },
            static: () => {
                this.setupStaticFeature();
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

        runnableFeatures.push("access");

        if (this.options.compress) {
            runnableFeatures.push("compress");
        }

        if (this.options.headers) {
            runnableFeatures.push("headers");
        }

        if (this.options.cookieParser) {
            runnableFeatures.push("cookieParser");
        }

        if (this.options.proxy) {
            runnableFeatures.push("proxy");
        }

        if (this.options.bodyParser) {
            runnableFeatures.push("bodyParser");
        }

        if (this.options.secureHeaderOptions !== false) {
            runnableFeatures.push("helmet");
        }

        runnableFeatures.push("static");

        if (this.options.middleware) {
            runnableFeatures.push("middleware");
        }

        if (this.options.corsOptions) {
            runnableFeatures.push("cors");
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

        runnableFeatures.forEach((feature) => {
            features[feature]();
        });
    }

    private setupAccessFeature() {
        if (this.options.access) {
            this.app.use(this.options.access);
        } else {
            this.app.use(logger.connectLogger(logger.getLogger("http"), { level: "auto", }));
        }
    }

    private setupMiddleware() {
        const mws = Object.prototype.toString.call(this.options.middleware) === "[object Array]"
            ? this.options.middleware : [this.options.middleware];
        mws.forEach(mw => {
            this.app.use(mw);
        });
    }

    private setupCorsFeature() {
        if (Array.isArray(this.options.corsOptions)) {
            this.options.corsOptions.forEach((config: ISingleRouteCorsOption) => {
                this.app.use(config.path, cors(config.corsOptions));
            });
        } else {
            this.app.use(cors(this.options.corsOptions));
        }
    }

    private setupHelmetFeature() {
        const options = {
            ...this.options?.secureHeaderOptions,
            contentSecurityPolicy: {
                ...this.options.secureHeaderOptions?.contentSecurityPolicy,
                directives: {
                    ...this.options.secureHeaderOptions?.contentSecurityPolicy?.directives,
                    scriptSrc: [
                        "'self'",
                        (req, res) => {
                            const fsResponsiveNonce = crypto.randomBytes(16).toString('base64');
                            res.locals.fsResponsiveNonce = fsResponsiveNonce;
                            return `'nonce-${fsResponsiveNonce}'`;
                        },
                        (req, res) => {
                            const csDataNonce = crypto.randomBytes(16).toString('base64');
                            res.locals.csDataNonce = csDataNonce;
                            return `'nonce-${res.locals.csDataNonce}'`;
                        },
                    ].concat(this.options.secureHeaderOptions?.contentSecurityPolicy?.directives?.scriptSrc || []),
                },
            }
        };
        this.app.use(helmet(options));
    }

    private setupCompressFeature() {
        this.app.use(Compression());
    }

    private setupCookieParserFeature() {
        this.app.use(CookieParser());
    }

    private changeProxyReqReferer(proxyReq: Http.ClientRequest, req: Express.Request, res: Express.Response) {
        const refererURL = new URL(req.header("Referer"));
        const hostStr = proxyReq.getHeader("Host") as string;
        refererURL.host = hostStr;
        if (hostStr.indexOf(":") === -1) {
            refererURL.port = protocalPortMap[refererURL.protocol];
        }
        proxyReq.setHeader("Referer", refererURL.href);
    }

    private getProxyMW(config: IProxyConfig) {
        const opt: IProxyConfig = {
            changeOrigin: true,
            changeOriginReferer: true,
            pathRewrite: {
                "^/proxy": "",
            },
            onError: (err, req, res, target) => {
                res.writeHead(500, {
                    "Content-Type": "text/plain",
                });
                res.end("proxying request error: " + err.message);
            },
            ...config,
        };
        // changeOriginReferer为true的前提必须是changeOrigin为true
        if (opt.changeOrigin === false) {
            opt.changeOriginReferer = false;
        }
        if (opt.changeOriginReferer !== false) {
            opt.onProxyReq = this.changeProxyReqReferer;
        }
        return createProxyMiddleware(opt);
    }

    private setupProxyFeature() {
        const proxyConfig = this.options.proxy;
        if (typeof proxyConfig === "string") {
            this.app.use("/proxy", this.getProxyMW({
                target: proxyConfig,
            }));
        } else if (Array.isArray(proxyConfig)) {
            proxyConfig.forEach((proxy: IServerProxyOption) => {
                this.app.use("/proxy" + proxy.path, this.getProxyMW({
                    pathRewrite: undefined,
                    ...proxy.config,
                }));
            });
        } else if (proxyConfig) {
            this.app.use("/proxy", this.getProxyMW({
                router: proxyConfig as IServerProxyRouter,
            }));
        }
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
        if (Object.prototype.toString.call(this.options.static) !== "[object Array]") {
            this.options.static = [];
        }
        const internalStatic = this.options.static[0];
        let staticOption = {};
        if (internalStatic && internalStatic.staticOption && internalStatic.isInternal) {
            staticOption = internalStatic.staticOption;
        }
        this.options.static.splice(0, 0, this.getInteralStatic(staticOption));
        this.options.static.forEach(staticOption => {
            staticOption.path.forEach(path => {
                if (!checkPositivePath(path)) {
                    this.app.use(
                        path,
                        Express.static(staticOption.directory, staticOption.staticOptions)
                    );
                }
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

    private ready() {
        if (IS_DEBUG_MODE) {
            const proxConfig = DEV_PROXY_CONFIG;
            if (proxConfig && Array.isArray(proxConfig)) {
                proxConfig.forEach((proxy: IServerProxyOption) => {
                    this.app.use(proxy.path, this.getProxyMW({
                        pathRewrite: undefined,
                        ...proxy.config,
                    }));
                });
            }
        }
        this.setMiddleware();
        this.setRouter();
    }

    /**
     * 启动Web服务器
     */
    public async bootstrapAsync() {
        if (!this.checkServerStarted()) {
            await this.bootstrapAsyncBefore();
            this.ready();
            // this.setCloseHandle();
            await this.listen(this.options.port, this.options.hostname);
            log.info(this.name, "bootstrapAsync", "port", this.options.port);
        }
        return this;
    }

    /**
     * 挂载该Web服务器的router点
     * @param router
     */
    public useRouter(router) {
        if (!this.checkServerStarted()) {
            if (!this.routers) {
                this.routers = [];
            }
            this.routers.push(router);
        }
        return this;
    }

    /**
     * 关闭该web服务器
     */
    public close(cb?: () => void) {
        this.server.close(() => {
            this.state = false;
            log.warn(this.name, "close", "port", this.options.port);
            if (typeof this.options.onServerClosed === "function") {
                this.options.onServerClosed();
            }
            if (typeof cb === "function") {
                cb();
            }
        });
    }

    /**
     * bootstrap before
     */
    protected async bootstrapAsyncBefore() {
        //
    }

    // public setStatic(staticRootPath, staticOption = {}) {
    //     log.info("setStatic recieve staticRootPath: ", staticRootPath);
    //     const path = staticRootPath.replace(/\/$/, "");
    //     const directory = Path.resolve(staticRootPath.replace(/^\//, ""));
    //     log.info("static path : ", path);
    //     log.info("static directory : ", directory);
    //     if (Object.prototype.toString.call(this.options.static) !== "[object Array]") {
    //         this.options.static = [];
    //     }
    //     this.options.static.push({
    //         path: [path],
    //         directory: directory,
    //         staticOption,
    //     });
    //     return this;
    // }
}

export default WebServer;
