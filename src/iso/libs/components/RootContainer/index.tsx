import React from "react";
import { IRootContainerProps } from "../../../../interface";
export default class RootContainer extends React.Component<IRootContainerProps, {}> {
    public render() {
        const {
            isCSR = true,
            initialState,
            children,
            meta,
        } = this.props;
        const {
            title,
            keywords,
            description,
            favicon,
            styles,
            scripts,
            links,
            metas,
            calcRootFontSize,
        } = meta;

        const viewport = "width=device-width,initial-scale=1,minimum-scale=1.0,maximum-scale=1,user-scalable=no";

        return (
            <html>
                <head>
                    <meta charSet="UTF-8" />
                    <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
                    <meta httpEquiv="x-ua-compatible" content="ie=edge" />
                    <meta name="viewport" content={viewport} />
                    <meta name="keywords" content={keywords} />
                    <meta name="description" content={description} />
                    {metas}
                    <title>{title}</title>
                    <link href={favicon} rel="icon" />
                    <link href={favicon} rel="shortcut icon" />
                    <link href={favicon} rel="bookmark" />
                    {links}
                    {
                        typeof calcRootFontSize === "number"
                            ? <script dangerouslySetInnerHTML={{
                                    __html: ['(function () {',
                                        'function setRootFontSize() {',
                                        'var rootElement = document.documentElement;',
                                        'var styleElement = document.createElement("style");',
                                        'var dpr = Number(window.devicePixelRatio.toFixed(5)) || 1;',
                                        'var rootFontSize = rootElement.clientWidth / ',
                                        calcRootFontSize / 100,
                                        ';',
                                        'rootElement.setAttribute("data-dpr", dpr.toString());',
                                        'rootElement.firstElementChild.appendChild(styleElement);',
                                        'styleElement.innerHTML = "html{font-size:" + rootFontSize + "px!important;}";',
                                        '}',
                                        'setRootFontSize();',
                                        'window.addEventListener("resize", setRootFontSize);',
                                        '})();'
                                    ].join(''),
                                }}></script>
                            :
                            (typeof calcRootFontSize === "function"
                                ? <script dangerouslySetInnerHTML={{
                                    __html: [
                                        '(',
                                        calcRootFontSize.toString(),
                                        ')();'
                                    ].join(''),
                                }}></script>
                                : ""
                            )
                    }
                    {styles && styles.map(style => style ? <link rel="stylesheet" key={style} href={style} type="text/css" /> : undefined)}
                </head>
                <body>
                    <div id="app">
                        {children}
                    </div>
                    <script dangerouslySetInnerHTML={{
                        __html: `window.__INITIAL_STATE__=${JSON.stringify(initialState || {}).replace(/</g, "\\u003c")};`
                            + (isCSR ? `;window.__isCSR__=${JSON.stringify(isCSR)};` : ""),
                    }}>
                    </script>
                    {scripts && scripts.map(script => script ? <script key={script} src={script} /> : undefined)}
                </body>
            </html>
        );
    }
}