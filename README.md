# mizar，a react server side render framework，support isomorphic render

## 使用此框架的应用程序，目录结构应为：
    -config   用于存放配置文件的目录
        -app.json   用于配置应用的运行时信息，比如该应用的node服务启动端口、cdn地址等
        -configure.json   用于配置应用的编译时信息，比如是否启用tslint、stylelint的配置、less-loader的配置等
    -src   应用代码源文件目录
        -isomorphic    同构内容所在目录，组件会被在客户端或服务端执行，需要注意执行环境特有能力的使用
            -pageRouters   应用的客户端路由文件所在目录，可以有多个路由配置，里面的每个文件都是路由所包含的页面组成的客户端单页入口应用的入口
                -index.tsx   文件中包含的页面组成的单页应用入口
            -pages    页面所在的目录
                -pageA    一个采用类组件形式开发的页面级redux组件
                    -index.tsx    页面组件入口文件
                    -index.less    页面组件样式文件
                    -action.ts    页面组件内所有action定义
                    -initialState.ts    页面组件reducer需要使用的初始值定义
                    -reduce.ts    页面组件reducer定义
                    -interface.ts    页面组件内所有的ts定义文件
                -pageB
                    - ...
            -typings
                -*.d.ts    同构目录中，css的类型定义
            -public   存放一些非模块化的的内容，每个文件会被直接用link或script引入
        -server   应用的服务端代码
            -apis   服务端node api存放目录，规则是请求路径已/apis/开头，文件名为方法名
                -api-name.ts
            -index.ts   服务端启动入口
    -package.json
    -tslint.json
    -tsconfig.json

## 使用类组件开发

定义类组件的方式 (以上面目录结构中的pageA举例)

    import { connect } from 'mizar/iso/connect';
    import pageAreducer from './reducer';
    import * as css from './index.less';
    import ChildComponentA fromm './childComponentA';
    import ChildComponentB fromm './childComponentB';
    import ChildComponentC fromm './childComponentC';

    class PageA extends React.Commponent {
        public static async getInitialData(fetch, options) {
            fetch({
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
            return {};
       }
        constructor(props) {
            super(props);
        }
        componentDidMount() {
        }
        public render() {
            return (<div className={(css as any).articleName>
                <ChildComponentA />
                <ChildComponentB />
                <ChildComponentC />
            </div>);
        }
    }
    export default connect()(pageAreducer, 'PageA', [childComponentA, childComponentB])(PageA);

### 1. 在服务端渲染时，如需要服务端获取初始数据的能力，需要具备公共的静态方法getInitialData。方法名不可更改。
   getInitialData入参两个：
   * fetch用于发送http请求，不可自行引入其他http请求工具，仅可用此入参。配置方式同axios。
   * options是当用户访问改页面时，请求中携带的query或路由参数，options.query代表url search部分的query，options.params代表路由参数，即‘path/:id/:name‘中的id和name会在params中。

### 2. 支持css module
   * 目前存在需要需要使用类型断言转为any的形式，待改进

### 3. 要支持redux，需要使用connect
   * 因为采用类组件+redux，所以需要使用connect，应用框架导出了两个connect，{ connect, reduxConnect} from 'mizar/iso/connect'。
   * reduxConnect是redux提供的原始connect高阶函数，connect是该框架基于reduxConnect进行的包装，用于进行组件、reducer、dispatch的关联，同时实现页面级组件的子组件需要服务端获取初始数据的支持。

### 4. 客户端路由配置
   * 支持客户端SPA的应用对非首次访问的页面在客户端按需加载，同时按需加载的页面组件支持loading配置
   * 该应用框架基于express、react-router，因此页面的路由配置和处理采用react-router、express routing方案。
   * pageRouters目录中的路由配置
      比如：src/isomorphic/pageRouter/index.ts文件中配置

            const pageRouter = [
               {
                  path: "/detail/article/:id",
                  exact: true,
                  component: "../pages/pageA",
               },{
                  path: "/detail/step/:id",
                  exact: true,
                  component: () => "../pages/pageB",
               },{
                   component: '../pages/NotFound',
               },
            ];
            export default pageRouter;
      代表访问/detail/article/2323232323，会将pageA页面渲染出来响应。
   * 路由配置中有个route配置的component值是() => '../pages/pageB'的形式，这就是表示pageB是个按需加载的页面，在第一次访问的是article时，在客户端再路由到step页面，此时pageB才会加载。
   * 由于支持页面组件的按需加载，因此在pages/pageB目录可以存在一个skeleton.tsx的文件，该文件会作为按需加载时，真实页面渲染出来前展示。
       该文件需要暴露一个纯函数，比如:

        export default function (props: ILoadingProps) {
            if (props.error) {
                return 'render an error state dom';
            } else if (props.pastDelay) {
                return 'render a loading dom';
            } else {
                return null; // nothing to render
            }
        }
        
        该函数接收一个对象类型的入参：

        interface ILoadingProps {
            error: {} | null; // 当按需加载的组件失败时，该字段会是一个错误对象，否则为null
            pastDelay: boolean; // 当按需加载的组件，花费超过200ms时，该字段会是true
        }

### 5. 支持server api
   * 该应用框架基于express，因此api的路由处理采用express routing方案
   * 需要在server目录中增加apis目录，apis里面的文件目录会转化为api的url path。
   * 文件中导出的几个特定名称的方法，http method为导出方法名：get｜post｜put｜delete。
   * 文件中以default导出的方法，会忽略方法名，作为express route的all方法中间件取处理http请求
   * 比如有个这样的目录：/src/server/apis/:path/method.ts，method.ts文件内容如下：

        export function <span style="color: #008000">love</span> (req, res) {
            res.json({});
        }

        export function <span style="color: purple">get</span>(req, res) {
            res.send('method api http get method');
        }
        export default function <span style="color: blue">like</span>(req, res) {
            res.send('like');
        }

       那客户端请求的时候:
       1. 以get 为http request method请求/api/123/method，这个get请求会被<span style="color: purple">get</span>请求处理函数处理，url中的123会存在于<span style="color: purple">get</span>请求处理函数的入参req中，以req.param.path的方式获取到。
       2. 以post 为http request method请求/api/456/method，这个post请求会被<span style="color: blue">like</span>请求处理函数处理，url中的456会存在于<span style="color: blue">like</span>请求处理函数的入参req中，以req.param.path的方式获取到。
       3. 以get 为http request method请求/api/789/method/<span style="color: #008000">love</span>，这个get请求会被<span style="color: #008000">love</span>请求处理函数处理，url中的789会在<span style="color: #008000">love</span>请求处理函数的入参req中，以req.param.path的方式获取到。
       4. 以delete 为http request method请求/api/000/method/<span style="color: #008000">love</span>，这个delete请求会响应404。

### 6. 服务端启动入口配置
   /src/server/index.ts内容：
    
    import { bootstrap } from "mizar/server/bootstrap";
    import clientRouter from "../isomorphic/pageRouters/index";
    (async () => {
        try {
            await bootstrap()([{
                name: "other",
            //     path: "/detail/video/*",
            //     clientRouter: videoRouter,
            // },{
                name: "article",
                path: "/detail/article/*",
                clientRouter,
            }, {
                name: "notfound",
                clientRouter: [clientRouter[2]]
            }], meta);
            logger.log('warning','msg');
        } catch (e) {
            console.log("启动错误", e);
        }
    })();

   * bootstrap高阶函数，可接收一个webserver：
   
        ...

        import WebServer from "mizar/server";

        ...

        const webserver = new WebServer({}: IWebServerOption);

        bootstrap(webserver)(...);
        
   * 比如，想要替换框架自带的日志记录功能，同时启用响应压缩、cookie和body格式化：
        
        ...

        import * as path from 'path';

        import * as YLogger from 'yog-log';

        ...

        const conf = {
            app: 'article-h5',
            log_path: path.join(__dirname, 'log'),
            intLevel: 16,
            debug: 1
        };

        const logger = YLogger.getLogger();

        const server = new WebServer({
            access: YLogger(conf),
            compress: true,
            bodyParser: true,
            cookieParser: true,
        });

        server.useMiddleware(YLogger(conf));

        bootstrap(server)(...);
   
   * WebServer构造函数接收一个可选配置对象参数：

        interface IWebServerOption {
            access?: any;
            compress?: boolean;
            cookieParser?: boolean;
            bodyParser?: boolean | IBodyParserOption;
            headers?: string;
            hostname?: "local-ip" | "local-ipv4" | "local-ipv6";
            port?: number;
            middleware?: any;
            static?: IStaticOption[];
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


