import { RouteConfig } from "react-router-config";

export interface IProxyConfig {
    urlPath: string;
    apiHost: string;
}

export interface IAppConf {
    name: string;
    port: number;
    assetsPathPrefix?: string;
    cdn?: string;
}

export interface IInitialRenderData {
    preloadData: any;
    pageReducerName: string;
    pageComName: string;
    // meta?: any;
}

export interface IMetaProps {
    title?: string;
    keywords?: string;
    description?: string;
    favicon?: string;
    styles?: string[];
    scripts?: string[];
    links?: any[];
    metas?: any[];
    calcRootFontSize?: number | (() => void);
    loading?: boolean | object;
}

export interface IRootContainerProps {
    initialState?: object;
    publicPath?: string;
    children?: any;
    meta?: IMetaProps;
    assetsMap?: string[];
    isCSR?: boolean;
}

export interface IPageRouter extends RouteConfig {
    name?: string;
}