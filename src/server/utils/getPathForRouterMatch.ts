export default function (url) {
    let len = url.indexOf("?");
    if (len < 0) {
        len = url.length;
    }
    return url.slice(0, len);
}