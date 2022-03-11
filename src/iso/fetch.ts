import axios from "axios";
import events from "events";
import { IFetchConfig } from "../interface";
import { loadingId } from "../config";
import { getStore } from "./getStore";
import { hideLoading as hideFetchLoading, showLoading as showFetchLoading } from "./libs/components/Loading/actions";
import getLogger from "./utils/logger";

declare const IS_SERVER_RUNTIME;
const logger = getLogger().getLogger("iso/fetch");
let loadingNumber = 0;

export const fetchWithRequestObject = (httpRequest) => async (config: IFetchConfig) => {
    if (!config || !config.url) {
        throw new Error("fetch() parameters error");
    }

    if (IS_SERVER_RUNTIME) {
        const httpMock = require("node-mocks-http");
        const apiController = require("../server/libs/apiController").default;

        // 是nodejs环境
        let data;
        let url = config.url;
        if (url.startsWith("http://") || url.startsWith("https://")) {
            // 从服务端请求API团队提供的API服务
            // 这种情况下的请求，cookie是无法工作的，获取的IP会替换成客户端的IP
            const response = await axios(config);
            data = response.data;
        } else {
            if (/^\/api\//.test(url)) {
                url = url.replace(/^\/api/, "");
            } else {
                logger.error(`api请求url未以/api/开头：${url}`);
                return;
            }
            if (!httpRequest) {
                throw new Error("请使用getInitialData中传入的fetch方法，否则nodejs无法获取到当前页面的url参数和cookie");
            }
            // 请求本地API
            const mockRequest = httpMock.createRequest({
                method: config.method.toUpperCase() || "GET",
                url,
                query: config.params || {},
                body: config.data || {},
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
                    apiController(mockRequest, mockResponse, reject);
                });
            })();
        }
        return data;
    } else {
        // 客户端浏览器环境

        if (config.showLoading) {
            // 显示loading
            showLoading();
        }
        const finalOptions = {
            withCredentials: true,
            ...config,
        };
        delete finalOptions.showLoading;
        if (config.showLoading) {
            return new Promise((resolve, reject) => {
                axios(finalOptions)
                    .then(response => {
                        hideLoading();
                        resolve(response);
                    })
                    .catch(reason => {
                        hideLoading();
                        reject(reason);
                    });
            });
        } else {
            return axios(finalOptions);
        }
    }
};

function showLoading() {
    loadingNumber++;
    getStore().dispatch(showFetchLoading(loadingId));
}

function hideLoading() {
    if (loadingNumber > 0) { 
        loadingNumber--;
        if (loadingNumber <= 0) {
            getStore().dispatch(hideFetchLoading(loadingId));
        }
    }
}

const fetch = fetchWithRequestObject(null);

export function getRawAxios() {
    return axios;
}

export default fetch;
