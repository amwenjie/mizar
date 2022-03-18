# mizar，a react server side render framework，support isomorphic render

## 使用此框架的应用程序，需要使用alcor打包编译工具。应用目录结构应为：
    -config   用于存放配置文件的目录
        -app.json   用于配置应用的运行时信息，比如该应用的node服务启动端口、cdn地址等
        -configure.json   用于配置应用的编译时信息，比如是否启用eslint、配置stylelint、配置less-loader等
    -src   应用代码源文件目录
        -isomorphic    同构内容所在目录，组件会被在客户端或服务端执行，需要注意执行环境特有能力的使用
            -index.ts    客户端启动入口
            -routers   应用的客户端路由文件所在目录
                -index.tsx
            -pages    页面所在的目录
                -pageA    一个采用类组件形式开发的页面级redux组件
                    -index.tsx    页面组件入口文件
                    -index.less    页面组件样式文件
                    -constant.ts    页面中使用到的常量文件
                    -action.ts    页面组件内所有action定义
                    -initialState.ts    页面组件reducer需要使用的初始值定义
                    -reducer.ts    页面组件reducer定义
                    -interface.ts    页面组件内所有的ts定义文件
                -pageB
                    - ...
            -typings
                -*.d.ts    同构目录中，css\module-federation模块等类型定义
            -tsconfig.json
        -public   存放一些非模块化的的内容，所需要用到的文件需要在服务端启动入口配置meta中加入，会在服务端渲染出的html中用标签引入
        -server   应用的服务端代码
            -apis   服务端node api存放目录，规则是请求路径已/apis/开头，文件名为方法名
                -api-name.ts
            -index.ts   服务端启动入口
        -tsconfig.json
    -package.json
    -tsconfig.json
    -tslint.json

## 使用类组件开发
   * 定义类组件的方式 (以上面目录结构中的pageA举例)
```
    import { connect } from 'mizar/iso/connect';
    import * as css from './index.less';
    import ChildComponentA from './childComponentA';
    import ChildComponentB from './childComponentB';
    import ChildComponentC from './childComponentC';

    class PageA extends React.Commponent {
        public static async getInitialData(initFetch, options) {
            const result = await initFetch({
                url: "/api/path/method/hahah",
                params: {
                    paramId: options.params.id,
                    queryId: options.query.id
                }
            }).then(data => {
                console.log("拿到data:", data);
            }).catch(e => {
                console.log("fetch error出错:", e);
            })
            return {
                data: result.data || {
                    text: "server init text",
                    count: 2222,
                }; // 仅如此举例，result数据结构要看接口响应内容
            };
        }
        constructor(props) {
            super(props);
        }
        componentDidMount() {
        }
        public render() {
            return (<div className={css.articleName>
                <h2>{this.props.data.count}</h2>
                <ChildComponentA />
                <ChildComponentB />
                <ChildComponentC />
                <div>
                    <a className="hh-aa" href="#" onClick={(e) => {
                        e.preventDefault();
                        this.addCounting();
                    }}>增加counting</a>
                </div>
            </div>);
        }

        private addCounting() {
            this.props.dispatch({
                type:"vAddCount",
                data: {
                    count: 333333
                }
            });
        }
    }

    export default connect()(PageA, [childComponentA, childComponentB]);
```

不限定必须使用类组件的开发形式，也可以使用函数组件。

## 使用函数组件开发
   * 还是上面那个pageA举例，函数式组件开发可以像这样：
```
    import { connect } from 'mizar/iso/connect';
    import * as css from './index.less';
    import ChildComponentA from './childComponentA';
    import ChildComponentB from './childComponentB';
    import ChildComponentC from './childComponentC';
    
    function PageA(props) {
        return (<div className={css.articleName>
            <h2>{props.data.count}</h2>
            <ChildComponentA />
            <ChildComponentB />
            <ChildComponentC />
            <div>
                <a className="hh-aa" href="#" onClick={(e) => {
                    e.preventDefault();
                    addCounting(props);
                }}>增加counting</a>
            </div>
        </div>);
    }

    PageA.getInitialData = async function getInitialData(initFetch, options) {
        const result = await initFetch({
            url: "/api/path/method/hahah",
            params: {
                paramId: options.params.id,
                queryId: options.query.id
            }
        }).then(data => {
            console.log("拿到data:", data);
        }).catch(e => {
            console.log("fetch error出错:", e);
        })
        return {
            data: result.data || {
                text: "server init text",
                count: 2222,
            }; // 仅如此举例，result数据结构要看接口响应内容
        };
    }

    function addCounting(props) {
        props.dispatch({
            type:"vAddCount",
            data: {
                count: 333333
            }
        });
    }
    
    export default connect()(PageA, [childComponentA, childComponentB]);
```
   * PageA的reducer.ts内容如下：
```
    export default function (state = {
        data: {
            text: "client init loading...",
            count: -1,
        },
    }, action) {
        switch (action.type) {
            case "vAddCount":
                return {
                    ...state,
                    data: {
                        ...state.data,
                        ...action.data,
                        count: state.data.count + action.data.count,
                    },
                };
            default:
                return {
                    ...state,
                    data: {
                        ...state.data,
                        ...action.data,
                    },
                };
        }
    }
```


### 1. 在服务端渲染时，如需要服务端获取初始数据的能力，需要具备公共的静态方法getInitialData。方法名不可更改。
   getInitialData入参两个：
   * fetch用于发送http请求，不可自行引入其他http请求工具，仅可用此入参。配置方式同axios。
   * options是当用户访问改页面时，请求中携带的query或路由参数，options.query代表url search部分的query，options.params代表路由参数，即‘path/:id/:name‘中的id和name会在params中。


### 2. 客户端启动入口配置
   * /src/isomorphic/entry/index.ts内容：
```
    import { bootstrap } from "mizar/iso/bootstrap";
    import articleRouter from "../routers/article";

    bootstrap(articleRouter)();
```


### 3. 客户端路由配置
   * 支持客户端SPA的应用对非首次访问的页面在客户端按需加载，同时按需加载的页面组件支持loading配置
   * 该应用框架基于express、react-router，因此页面的路由配置和处理采用react-router、express routing方案。
   * pageRouters目录中的路由配置，比如：src/isomorphic/pageRouter/index.ts文件中配置
```
    import loadable from '@loadable/component';
    import React from "react";
    import NotFound from "../pages/NotFound";
    import ArticleDetail from "../pages/ArticleDetail";
    import VideoDetail from "../pages/VideoDetail";

    const AsyncCom = loadable(() => import("../pages/VideoDetail"));
    const pageRouter = [
        {
            path: "/detail/iso/:id",
            element: <VideoDetail />,
        },
        {
            path: "/detail/article/:id",
            element: <ArticleDetail />,
        },
        {
            path: "/detail/video/:id",
            element: AsyncCom,
        },
        {
            path: "*",
            element: <NotFound />,
        }
    ];

    export default pageRouter;
```

### 4. 要支持redux，需使用connect()
   * 该应用框架采用react-redux的connect来支持redux，导出了两个connect，{ connect, reduxConnect} from 'mizar/iso/connect'。
   * reduxConnect是redux提供的原始connect高阶函数，connect是该框架基于reduxConnect进行的包装，用于进行组件、reducer、dispatch的关联，同时实现页面级组件的子组件需要服务端获取初始数据的支持。
   * connect用法：
       1. connect入参同redux connect，调用connect()后返回一个函数；
       2. connect()返回的函数入参有四个：connect()(component: react.Component, reducer: redux.Reducer, reducerName: string, childComp: react.Component[]);
   * mizar 版本 > 0.0.30时，中间两个参数可省略，省略后，编译工具alcor打包时会注入，规则：
      component在定义和导出connect包裹后的组件时，实现代码需要在目录中的index.tsx文件中，打包时会寻找index.tsx同目录的reducer.ts文件，文件中需要具有default function，或component同名的但是首字母小写化、以Reducer结尾规则的function
```
    src/isomorphic/pages/PageA/reducer.ts :

    export function pageAReducer() {}
    或
    export default function() {}

    src/isomorphic/pages/PageA/index.tsx :

    class PageA extends React.Commponent {
    }

    export default connect()(PageA, [childComponentA, childComponentB]);
```
   * mizar 版本 <= 0.0.30，中间两个参数不可省略，使用规则为:
```
    src/isomorphic/pages/PageA/index.tsx :

    ...
    import pageAreducer from './reducer';
    ...

    class PageA extends React.Commponent {
    }

    export default connect()(pageAreducer, 'PageA', [childComp...])(PageA)
```

### 5. 服务端启动入口配置
   * /src/server/index.ts内容：
```
    import { bootstrap } from "mizar/server/bootstrap";
    import clientRouter from "../isomorphic/routers/index";
    (async () => {
        try {
            await bootstrap()(clientRouter, meta);
            logger.log('warning','msg');
        } catch (e) {
            console.log("启动错误", e);
        }
    })();
```
   * bootstrap高阶函数，可接收一个webserver：
```
    ...
    import WebServer from "mizar/server";
    ...

    const webserver = new WebServer({}: IWebServerOption);
    bootstrap(webserver)(...);
```
   * WebServer构造函数接收一个可选配置对象参数：
```
    interface IWebServerOption {
        access?: any;
        compress?: boolean;
        cookieParser?: boolean;
        bodyParser?: boolean | IBodyParserOption;
        headers?: string;
        hostname?: "local-ip" | "local-ipv4" | "local-ipv6";
        port?: number;
        proxy?: string | {[path: string]: string;} | { path: string; config: Options; }[];
        middleware?: any;
        static?: IStaticOption[];
        secureHeaderOptions?: HelmetOptions | false;
        corsOptions?: CorsOptions | CorsOptionsDelegate | ISingleRouteCorsOption[];
        onServerClosed?: () => void;
        onListening?: (server: net.Server) => void;
    }
    
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
    
    interface ISingleRouteCorsOption {
        path: string;
        corsOptions: CorsOptions | CorsOptionsDelegate;
    }
```
   * 其中的bodyParser、cookieParser默认为开启状态，secureHeaderOptions默认启用，具体响应策略可debug看响应头

   * 示例：
```
    1. 想要替换框架自带的日志记录功能，同时启用响应压缩：

    ...
    import * as path from 'path';
    import * as YLogger from 'yog-log';
    import { setLogger } from "mizar/server/utils/logger";
    ...
    
    // setLogger用于替换框架中的log
    setLogger({
        getLogger: () => {
            const logger = YLogger.getLogger();
            return {
                log: logger.debug.bind(logger),
                info: logger.debug.bind(logger),
                warn: logger.debug.bind(logger),
                error: logger.debug.bind(logger),
            }
        }
    })
    const conf = {  
        app: 'app-name',
        log_path: path.join(__dirname, 'log'),
        intLevel: 16,
        debug: 1
    };
    const logger = YLogger.getLogger();
    const server = new WebServer({
        access: YLogger(conf), // access是http请求log
        compress: true,
    });

    server.useMiddleware(YLogger(conf));

    bootstrap(server)(...);
    
    2. 配置响应头中的安全策略和CORS响应策略：

    ...
    const server = new WebServer({
        secureHeaderOptions: false, // 关闭响应头中安全策略输出
        secureHeaderOptions: {
            contentSecurityPolicy: {}, // 配置响应头中CSP相关策略
        },
        corsOptions: {}, // 配置对所有请求响应的cors策略
        corsOptions: [{
            path: "specific-path",
            corsOptions: {},
        }], // 遍历数组，对每个对象中指定path的请求响应对应的cors配置策略
    });

    server.useMiddleware(YLogger(conf));

    bootstrap(server)(...);
```

### 6. 支持动态路由（server端api）
   * 该应用框架基于express，因此api的路由处理采用express routing方案。
   * 需要在server目录中增加apis目录，apis里面的文件目录会转化为api的url path。
   * 文件中导出的几个特定名称的方法，http method为导出方法名：get｜post｜put｜delete。
   * 文件中以default导出的方法，会忽略方法名，作为express route的all方法中间件取处理http请求。
   * 文件中定义的请求处理函数，第一个入参是http request对象，第二个入参是http response对象。但**需要注意**：
    由于处理函数可能会同时处理客户端和服务端getInitialData中的请求，由于目前的实现**无法抹平差异**，因此如果会同时处理客户端和服务端的请求，第二个入参的可用api只能是json()｜send()；如果处理客户端请求，第二个入参的可用api是express response所提供的api。
   * 比如有个这样的目录：/src/server/apis/:path/method.ts，method.ts文件内容如下：
```
    export function love (req, res) {
        res.json({});
    }
    export function get(req, res) {
        res.send('method api http get method');
    }
    export default function like(req, res) {
        res.send('like');
    }
```
    那客户端请求的时候:
    1. 以get 为http request method请求/api/123/method，这个get请求会被export function get 请求处理函数处理，url中的123会存在于请求处理函数的入参req中，以req.param.path的方式获取到。
    2. 以post 为http request method请求/api/456/method，这个post请求会被export function like 请求处理函数处理，url中的456会存在于请求处理函数的入参req中，以req.param.path的方式获取到。
    3. 以get 为http request method请求/api/789/method/love，这个get请求会被export function love 请求处理函数处理，url中的789会在请求处理函数的入参req中，以req.param.path的方式获取到。
    4. 以delete 为http request method请求/api/000/method/love，这个delete请求会响应404。


### 7. 服务端接口代理
   * WebServer构造函数入参中有个proxy字段，用于配置接口代理，所有以/proxy开头的接口，才会被当作需要代理转发的接口应用对应config配置。
   * 所有被代理转发的请求，都会默认在转发到请求target域名接口的时候将请求头的Host和Referer中域名部分改写为target真实域名。可通过增加changeOrigin: false配置来关闭改写Host和Referer操作或仅增加changeOriginReferer: false配置来关闭改写Referer但保持改写Host的操作。
   * 支持三种代理配置形式：
       1. string：接口路径中/proxy之后的内容就是需要代理的真实接口地址，都会被代理到该字符串的域名上去。
       2. {[path: string]: string;}：接口路径中/proxy之后的内容，匹配到的path对应的接口请求会被代理到对应value指定的域名上去。
       3. { path: string; config: Options; }\[\]：接口路径中/proxy之后的内容，匹配到path对应的接口请求会用config配置去处理代理策略。[详细Options参见此处](https://github.com/chimurai/http-proxy-middleware#options)。
   * 当需要灵活、自由度更大的扩展时，可以考虑用前面第6点介绍的动态路由（server端api）的能力来替代该接口代理转发的能力。
   * 举例：
```
    /src/server/index.ts:

    ...
    import { bootstrap } from "mizar/server/bootstrap";
    import WebServer from "mizar/server";
    ...

    const webserver = new WebServer({
        proxy: "http://target.com", // 如果请求/proxy/ajax/api,会被代理到http://target.com/ajax/api
        proxy: {
            "/ajax": "http://target.com", // 如果请求/proxy/ajax/api,会被代理到http://target.com/ajax/api
            "/user": "http://user.com", // 如果请求/proxy/user/anypath/api,会被代理到http://user.com/user/anypath/api
        },
        proxy: [
            {
                path: "/ajax",
                config: {
                    target: "http://target.com",
                    changeOrigin: false, // 显示的关闭代理转发请求的时候更改请求头中的Host和Referer
                    pathRewrite: {
                        "^/proxy/ajax": "",
                    },
                },
            }, // 如果请求/proxy/ajax/api1/getsomething,会被代理到http://target.com/api1/getsomething
            {
                path: "/user",
                config: {
                    target: "http://user.com",
                    pathRewrite: {
                        "^/user/ajax": "/anotheruserpath",
                    },
                }
            }, // 如果请求/proxy/user/ajax/getsomething,会被代理到http://user.com/anotheruserpath/getsomething
        ],
    });
    bootstrap(webserver)(...);
```

### 8. 页面组件内跳转功能、url参数获取说明
   * 由于mizar 不同版本使用的react-router版本不同，两个主要功能需要特殊说明
    1. 跳转功能
        * mizar 版本 <= 0.0.30 ，可用this.props.history.push("")，进行跳转
        * mizar 版本 >= 0.0.31 ，需要将跳转功能封装函数组件（function component），其中使用useNavigate，进跳转
    2. url参数获取
        * mizar 版本 <= 0.0.30 ，可用this.props.match，获取url param参数
        * mizar 版本 >= 0.0.31 ，需要提供一个函数组件（function component），其中使用useParams来获取url param参数
   * 举例：
```
    mizar 版本 <= 0.0.30
    src/isomorphic/pages/PageA/index.tsx :

    class PageA extends React.Commponent {
        render() {
            const id = this.props.match ? this.props.match.id : "";
            return (<div>
                <a href="#" onClick={(e) => {
                    e.preventDefault();
                    this.props.history.push("url" + id);
                }}>跳转到url</a>
            </div>)
        }
    }

    mizar 版本 >= 0.0.31
    src/isomorphic/pages/PageA/index.tsx :

    ...
    import { useNavigate, useParams, useSearchParams } from "react-router-dom";
    ...

    function JumpTo ({url, text}) {
        const navigate = useNavigate();
        const {id} = useParams();
        const [searchParams] = useSearchParams();
        return (<a href="#" onClick={(e) => {
            e.preventDefault();
            navigate(url + id + "?search=" + searchParams.get("query"));
        }}>{text}</a>);
    }
    class PageA extends React.Commponent {
        render() {
            return (<div>
                <JumpTo text="跳转到url" url="url"/>
            </div>);
        }
    }
```