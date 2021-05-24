export default class StringUtil {

    /**
     * 返回右侧的字符
     */
    public static getRightCharacter(str) {
        const arr = str.split("");
        return arr[arr.length - 1];
    }

    /**
     * 编码html实体义
     */
    public static decodeHtml(str) {
        str = str.replace(/&amp;/g, "&");
        str = str.replace(/&lt;/g, "<");
        str = str.replace(/&gt;/g, ">");
        str = str.replace(/&quot;/g, "'");
        str = str.replace(/&#039;/g, "'");
        return str;
    }

    /**
     * 编码html实体义
     */
    public static encodeHtml(str) {
        str = str.replace(/&/g, "&amp;");
        str = str.replace(/</g, "&lt;");
        str = str.replace(/>/g, "&gt;");
        str = str.replace(/"/g, "&quot;");
        str = str.replace(/'/g, "&#039;");
        return str;
    }

    /**
     * 清除右侧空格
     */
    public static cleanLFAndSpace(str) {
        if (typeof str !== "string") {
            return JSON.stringify(str);
        }
        return str.replace(/\r|\n|\t/g, " ").replace(/\s+/g, " ");
    }
}
