import { type AxiosRequestConfig } from "axios";
import { type Params } from "react-router-dom";
export interface IGetMetaFn {
    (): IMetaProps;
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

export interface IPageRouter {
    caseSensitive?: boolean;
    children?: IPageRouter[];
    element?: React.ReactNode;
    index?: boolean;
    path?: string;
    name?: string;
}

export interface IFetchConfig extends AxiosRequestConfig {
    showLoading?: boolean;
}

export interface IRouteContainerProps {
    pageRouter: IPageRouter[];
    dispatch?;
    [key: string]: any;
}

export interface IMatchedRouteCom {
    element: React.ReactNode;
    pageComName?: string;
    params?: Params;
 }