import axios from "axios";
import events from "events";
import { loadingId } from "../config";
import { getStore } from "./getStore";
import { hideLoading as loadingHideAction, showLoading as loadingShowAction } from "./libs/components/Loading/actions";
import getLogger from "./utils/getLogger";

declare const IS_SERVER_RUNTIME;
const logger = getLogger().getLogger("iso/fetch");
let loadingNumber = 0;

export const fetchWithRequestObject = (httpRequest) => async (url, options?) => {
    if (options === undefined) {
        options = url;
        url = options.url;
    }
    
    if (IS_SERVER_RUNTIME) {
        const httpMock = require("node-mocks-http");
        const apiController = require("../server/libs/apiController").default;

        // 是nodejs环境
        let data;
        if (url.startsWith("http://") || url.startsWith("https://")) {
            // 从服务端请求API团队提供的API服务
            // 这种情况下的请求，cookie是无法工作的，获取的IP会替换成客户端的IP
            const response = await axios({...options});
            data = response.data;
        } else {
            if (/^\/api\//.test(url)) {
                url = url.replace(/^\/api/, "");
            } else {
                logger.error("api的请求必须以\"/api\"开头");
                return;
            }
            if (!httpRequest) {
                throw new Error("请使用getInitialData中传入的fetch方法，否则nodejs无法获取到当前页面的url参数和cookie");
            }
            const paramObj: any = {};
            if (options.params) {
                paramObj.query = {
                    ...options.params,
                };
            }
            if (options.data) {
                paramObj.body = {
                    ...options.data,
                };
            }
            // 请求本地API
            const mockRequest = httpMock.createRequest({
                method: "GET",
                url,
                ...paramObj,
                cookies: httpRequest && httpRequest.cookies,
                headers: httpRequest && httpRequest.headers,
            });

            data = await (async () => {
                return new Promise((resolve, reject) => {
                    const mockResponse = httpMock.createResponse({
                        eventEmitter: events.EventEmitter,
                    });
                    mockResponse.addListener("send", () => {
                        const ct = mockResponse.getHeader("content-type") as string;
                        if (ct && /json/.test(ct)) {
                            resolve(mockResponse._getJSONData());
                            return;
                        }
                        resolve(mockResponse._getData());
                    });
                    // 为了和client请求走express路由给的request保持一致
                    // 页面初始化数据获取中的请求只支持get方法，因此req.body是undefined
                    delete mockRequest.body;
                    apiController(mockRequest, mockResponse, reject);
                });
            })();
        }
        return data;
    } else {
        // 客户端浏览器环境
        if (!options.noLoading) {
            // 显示loading
            showLoading();
        }
        const finalOptions = {
            withCredentials: true,
            ...options,
        };
    
        return new Promise((resolve, reject) => {
            axios(finalOptions)
                .then((response) => {
                    resolve(response.data);
                    hideLoading();
                }, (reason) => {
                    reject(reason);
                    hideLoading();
                });
        });
    }
};

function showLoading() {
    loadingNumber++;
    getStore().dispatch(loadingShowAction(loadingId));
}

function hideLoading() {
    loadingNumber--;
    if (loadingNumber <= 0) {
        getStore().dispatch(loadingHideAction(loadingId));
    }
}

const fetch = fetchWithRequestObject(null);
export default fetch;
