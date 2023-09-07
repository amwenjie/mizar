import { type AxiosRequestConfig } from "axios";
import { IRouterHandler, Router } from "express";
import { type ReactNode } from "react";
import { RouteObject, type Params} from "react-router-dom";
export interface IGetMetaFn {
    (): IMetaProps;
}

export interface IDynamicRoute {
    [path: string]: IDynamicRoute | {
        [method: string]: Function | any;
    };
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
    styles?: (string|JSX.Element)[];
    scripts?: (string|JSX.Element)[];
    links?: (string|JSX.Element)[];
    metas?: JSX.Element[];
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

export type IPageRouter = RouteObject & {
    caseSensitive?: boolean;
    children?: IPageRouter[];
    path?: string;
    name?: string;
    element?: React.ReactNode; // | LoadableComponent<DefaultComponent<any>>;
}
// {
//     caseSensitive?: boolean;
//     children?: IPageRouter[];
//     element?: React.ReactNode;
//     path?: string;
//     name?: string;
// }

export interface IFetchConfig extends AxiosRequestConfig {
    showLoading?: boolean;
}

export interface IRouteContainerProps {
    pageRouter: IPageRouter[];
    dispatch?;
    children?: ReactNode;
    [key: string]: any;
}

export interface IMatchedRouteCom {
    element: ReactNode;
    pageComName?: string;
    params?: Params;
}