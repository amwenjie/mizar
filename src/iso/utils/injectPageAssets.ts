export default function (pageName) {
    const pageAssets: any = (window as any).__ASSETS_MAP__;
    if (pageAssets && pageAssets.length) {
        const assets = pageAssets.filter(path => new RegExp("page\\/" + pageName + "_.{8}\\.(css|js)$").test(path));
        assets.forEach(path => {
            if (path.endsWith(".js")) {
                const s = document.createElement("script");
                s.src = path;
                document.body.appendChild(s);
                pageAssets.splice(pageAssets.indexOf(path), 1);
                delete (window as any).__ASSETS_MAP__[path];
            } else if (path.endsWith(".css")) {
                const l = document.createElement("link");
                l.rel = "stylesheet";
                l.type = "text/css";
                l.href = path;
                document.head.appendChild(l);
                pageAssets.splice(pageAssets.indexOf(path), 1);
            }
        })
    }
}