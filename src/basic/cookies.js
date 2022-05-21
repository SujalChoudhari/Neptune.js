
/**
 * @class Cookies
 * @classdesc Class for managing cookies.
 * @hideconstructor
 * 
 */
export class Cookies {

    /**
     * @method
     * @description Sets a cookie.
     * @param {string} name - The name of the cookie.
     * @param {string} value - The value of the cookie.
     * 
     * @example
     * Cookies.set("name", "value");
     */
    save(name, value) {
        document.cookie = name + "=" + value + ";";
    }


    /**
     * @method
     * @description Gets a cookie.
     * @param {string} name - The name of the cookie.
     * @returns {string} The value of the cookie.
     * 
     * @example
     * Cookies.get("name");
     * 
     */
    load(name) {
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].split("=");
            if (cookie[0] == name) {
                return cookie[1];
            }
        }
        return null;
    }

    /**
     * @method
     * @description Deletes a cookie.
     * @param {string} name - The name of the cookie.
     * 
     * @example
     * Cookies.delete("name");
     * 
     */
    delete(name) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    }

    /**
     * @method
     * @description Deletes all cookies.
     * 
     * @example
     * Cookies.deleteAll();
     * 
     */
    deleteAll() {
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].split("=");
            this.delete(cookie[0]);
        }
    }

}