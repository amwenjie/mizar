export interface IProxyConfig {
    urlPath: string;
    apiHost: string;
}

export interface ICustomConfig {
    port: number;
    assetsPathPrefix?: string;
    cdn?: string;
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