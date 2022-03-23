import axios from "axios";
import events from "events";
import httpMock, { type RequestMethod } from "node-mocks-http";
import { IFetchConfig } from "../interface.js";
import { loadingId } from "../config/index.js";
import apiController from "../server/libs/apiController.js";
import httpResCodeMap from "../server/utils/httpResCodeMap.js";
import { getStore } from "./getStore.js";
import { hideLoading as hideFetchLoading, showLoading as showFetchLoading } from "./components/Loading/actions.js";
import getLogger from "./utils/logger.js";

declare const IS_SERVER_RUNTIME;
const logger = getLogger().getLogger("iso/fetch");
let loadingNumber = 0;

export const fetchWithRequestObject = (httpRequest) => async (config: IFetchConfig) => {
    if (!config || !config.url) {
        throw new Error("fetch() parameters error");
    }

    if (IS_SERVER_RUNTIME) {
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
                method: (config.method.toUpperCase() || "GET") as RequestMethod,
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
                    mockResponse.addListener("end", () => {
                        let data;
                        if (mockResponse._isJSON()) {
                            data = mockResponse._getJSONData();
                        } else {
                            data = mockResponse._getData();
                        }
                        const status = mockResponse._getStatusCode();
                        const res = {
                            data,
                            status,
                            headers: mockResponse._getHeaders(),
                            statusText: httpResCodeMap[status],
                        };
                        
                        if (status !== 200) {
                            reject(res)
                        } else {
                            resolve(res);
                        }
                    });
                    apiController(mockRequest, mockResponse);
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
