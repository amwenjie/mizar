import StringUtil from "./stringUtil.js";

class DateUtil {

    /**
     * 格式化时间
     * @param Date date
     * @param format "yyyy-MM-dd hh:mm:ss.uuu"
     * @return string date
     */
    public static formatByString(date, format = "yyyy-MM-dd hh:mm:ss.uuu"): string {
        if (typeof date === "string" || date === "number") {
            const time = Number(date);
            if (isNaN(time)) {
                throw new Error("错误的时间值" + date);
            }
            date = new Date(time);
        }
        const o = {
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
            "h+": date.getHours(),
            "m+": date.getMinutes(),
            "q+": Math.floor((date.getMonth() + 3) / 3),
            "s+": date.getSeconds(),
            "u+": date.getMilliseconds(),
        };
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (const k in o) {
            if (o.hasOwnProperty(k)) {
                let pad = "00";
                if (k === "u+") {
                    pad = "000";
                }
                if (new RegExp("(" + k + ")").test(format)) {
                    format = format
                        .replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : (pad + o[k]).substr(("" + o[k]).length));
                }
            }
        }
        return format;
    }

    /**
     * @param Date date
     * @return string  "yyyy-MM-dd hh:mm:ss.uuu"
     */
    public static getDateTimeString(date): string {
        return DateUtil.formatByString(date, "yyyy-MM-dd hh:mm:ss.uuu");
    }

    /**
     * @param Date date
     * @return string "yyyyMMddhhmmssuuu"
     */
    public static getDateTimeNumber(date): string {
        return DateUtil.formatByString(date, "yyyyMMddhhmmssuuu");
    }

    public static getTimeOutByString(str) {
        let num = 0;
        const meta = str.split("+");
        meta.map((item) => {

            const symol = StringUtil.getRightCharacter(item);
            const n = item.replace(/[a-z]/g, "");
            switch (symol) {
                case "s":
                    num += n * 1000;
                    break;
                case "m":
                    num += n * 60 * 1000;
                    break;
                case "h":
                    num += n * 60 * 60 * 1000;
                    break;
                case "d":
                    num += n * 24 * 60 * 60 * 1000;
                    break;
                default:
            }
        });
        return num;
    }
}

export default DateUtil;
