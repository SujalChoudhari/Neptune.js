export class Storage {
    static Set(key, value, persistent = false) {
        if (persistent) {
            localStorage.setItem(key, value);
        } else {
            sessionStorage.setItem(key, value);
        }
    }

    static Get(key) {
        let data;
        data = sessionStorage.getItem(key);
        if (!data)
            data = localStorage.getItem(key);
        return data;
    }

    static Remove(key) {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
    }

    static Clear() {
        sessionStorage.clear();
        localStorage.clear();
    }

}