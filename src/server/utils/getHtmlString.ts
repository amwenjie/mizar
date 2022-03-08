export default function getHtmlString(props): string {
        const {
            isCSR = true,
            initialState,
            children,
            meta,
        } = props;
        const {
            title,
            keywords,
            description,
            favicon,
            styles = [],
            scripts = [],
            links = [],
            metas = [],
            calcRootFontSize,
        } = meta;

        return `<html>
    <head>
        <meta charSet="UTF-8" /><meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" /><title>${title}</title><meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1.0,maximum-scale=1,user-scalable=no" /><meta name="keywords" content="${keywords}" /><meta name="description" content="${description}" />
        ${metas.join("")}${favicon
            ? ['<link href="',
                '" rel="icon" /><link href="',
                '" rel="shortcut icon" /><link href="',
                '" rel="bookmark" />'].join(favicon)
            : ""}${links.join("")}${styles.join("")}
        <script>${
            typeof calcRootFontSize === "number"
                ? ['(function () {',
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
                    '}());'].join('')
                : typeof calcRootFontSize === "function"
                    ? "(" + calcRootFontSize.toString() + "());" : ""
        }</script>
    </head>
    <body>
        <div id="app">
            ${children}
        </div>
        <script>;window.__INITIAL_STATE__=${JSON.stringify(initialState || {}).replace(/</g, "\\u003c")};${isCSR ? ";window.__isCSR__=" + JSON.stringify(isCSR) + ";" : ""}</script>${scripts.join("")}
    </body>
</html>`;
    }