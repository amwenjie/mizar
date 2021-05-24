import * as Express from "express";
export interface IProxyConfig {
    urlPath: string;
    apiHost: string;
}

export interface ICustomConfig {
    port: number;
    assetsPathPrefix?: string;
    cdn?: string;
    logger?: string;
    tslint?: {
        disable: boolean;
    };
    vendorPack?: {
        minify: boolean;
        browserVendor: any[]
    };
    clientPack?: {
        minify?: boolean;
        cssModule?: boolean;
        chunk?: boolean;
        style?: {
            sourceMap?: boolean;
            base64?: boolean;
            ieCompat?: boolean;
        }
    };
    serverPack: {
        minify?: boolean;
        templateMinify?: boolean;
        debugPort: number;
    };
}
interface IRouter {
    router: Express.Router;
    getRouter: () => Express.Router;
    setRouter: () => void;
    [propsName: string]: any;
}