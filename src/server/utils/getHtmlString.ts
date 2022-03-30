import { type Request, type Response } from "express";

let afsFn;

function getClientStoreData(initialState, onlyCSR) {
    return `;window.__INITIAL_STATE__=${JSON.stringify(initialState || {}).replace(/</g, "\\u003c")};${onlyCSR ? ";window.__onlyCSR__=" + JSON.stringify(onlyCSR) + ";" : ""}`;
}

function getAutoFontSizeFn(calcRootFontSize) {
    if (typeof afsFn === "undefined") {
        afsFn = `${typeof calcRootFontSize === "number"
            ? ['(function () {',
                'var debc;',
                'function setRootFontSize() {',
                'var rootElement = document.documentElement;',
                'var styleElement = document.createElement("style");',
                'var dpr = Number(window.devicePixelRatio.toFixed(5)) || 1;',
                'var rootFontSize = rootElement.clientWidth / ',
                calcRootFontSize / 100,
                ';rootElement.setAttribute("data-dpr", dpr.toString());',
                'rootElement.style.fontSize = rootFontSize + "px";',
                // 'rootElement.firstElementChild.appendChild(styleElement);',
                // 'styleElement.innerHTML = "html{font-size:" + rootFontSize + "px!important;}";',
                '}setRootFontSize();',
                'window.addEventListener("resize", function () { clearTimeout(debc); debc = setTimeout(setRootFontSize, 500); });',
                '}());'].join('')
            : typeof calcRootFontSize === "function"
                ? "(" + calcRootFontSize.toString() + "());" : ""}`;
    }
    return afsFn;
}

export default function getHtmlString(req: Request, res: Response, props): string {
        const {
            onlyCSR = true,
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

        const clientStore = getClientStoreData(initialState, onlyCSR);

        const rfs = getAutoFontSizeFn(calcRootFontSize);
        return `<html>
    <head>
        <meta charSet="utf-8" /><meta httpEquiv="content-type" content="text/html; charset=utf-8" /><title>${title}</title><meta httpEquiv="x-ua-compatible" content="ie=edge" />
        ${keywords ? ['<meta name="keywords" content="', '" />'].join(keywords) : ""}${keywords ? ['<meta name="description" content="', '" />'].join(description) : ""}
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1.0,maximum-scale=1,user-scalable=no" />${metas.join("")}${favicon
            ? ['<link href="',
                '" rel="icon" /><link href="',
                '" rel="shortcut icon" /><link href="',
                '" rel="bookmark" />'].join(favicon)
            : ""}${links.join("")}${styles.join("")}${rfs ? [
            `<script nonce="${res.locals.fsResponsiveNonce}">`,
            '</script>'].join(rfs) : ""}
    </head>
    <body>
        <div id="app">${children}</div><script nonce="${res.locals.csDataNonce}">${clientStore}</script>${scripts.join("")}
    </body>
</html>`;
    }