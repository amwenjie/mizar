export default function (url) {
    let len = url.indexOf("?");
    if (len < -1) {
        len = url.length;
    }
    return url.slice(0, len);
}