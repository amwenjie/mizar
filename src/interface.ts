import { RouteConfig, RouteConfigComponentProps } from "react-router-config";
import { Location } from "history"

export interface IProxyConfig {
    urlPath: string;
    apiHost: string;
}

export interface ICustomConfig {
    port: number;
    assetsPathPrefix?: string;
    cdn?: string;
    debugPort?: number;
    logger?: string;
    tslint?: {
        disable: boolean;
    };
    stylelint?: boolean | string | object;
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
}

export interface IPageRouter {
    name: string;
    location?: Location;
    component?: string | React.ComponentType<RouteConfigComponentProps<any>> | React.ComponentType;
    path?: string | string[];
    exact?: boolean;
    strict?: boolean;
    routes?: RouteConfig[];
    render?: (props: RouteConfigComponentProps<any>) => React.ReactNode;
    [propName: string]: any;
}