export default function (pageName) {
    const pageAssets: any = (window as any).__ASSETS_MAP__;
    if (pageAssets && pageAssets.length) {
        const assets = pageAssets.filter(path => new RegExp("page\\/" + pageName + "_.{8}\\.(css|js)$").test(path));
        assets.forEach(path => {
            if (path.endsWith(".css")) {
                const l = document.createElement("link");
                l.rel = "stylesheet";
                l.type = "text/css";
                l.href = pageAssets.splice(pageAssets.indexOf(path), 1)[0];
                document.head.appendChild(l);
            } else if (path.endsWith(".js")) {
                const s = document.createElement("script");
                s.src = pageAssets.splice(pageAssets.indexOf(path), 1)[0];
                document.body.appendChild(s);
            } 
        })
    }
}