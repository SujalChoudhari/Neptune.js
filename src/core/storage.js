
/**
 * @class Storage
 * @description A class for storing data in the browser's local storage or session storage.
 * @example
 * // Set a value in the session storage
 * Storage.Set("key", "value");
 * 
 * // Get a value from the session storage
 * let value = Storage.Get("key");
 * @static
 */
export class Storage {

    /**
     * Set a value in the browser's local storage or session storage.
     * @param {string} key The key of the data to be stored.
     * @param {string} value The value of the data to be stored.
     * @param {boolean} persistent Whether the data should be stored in the local storage or session storage.
     */
    static Set(key, value, persistent = false) {
        if (persistent) {
            localStorage.setItem(key, value);
        } else {
            sessionStorage.setItem(key, value);
        }
    }

    /**
     * Get a value from the browser's local storage or session storage.
     * @param {string} key The key of the data to be retrieved.
     * @returns {string} The data stored in the browser's local storage or session storage.
     */
    static Get(key) {
        let data;
        data = sessionStorage.getItem(key);
        if (!data)
            data = localStorage.getItem(key);
        return data;
    }

    /**
     * Remove a value from the browser's local storage or session storage.
     * @param {string} key The key of the data to be removed.
     * @returns {string} The data stored in the browser's local storage or session storage.
     * 
     */
    static Remove(key) {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
    }

    /**
     * Clear the browser's local storage or session storage.
     */
    static Clear() {
        sessionStorage.clear();
        localStorage.clear();
    }

}