
export class Cookies {

    save(name, value) {
        document.cookie = name + "=" + value + ";";
    }

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

    delete(name) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    }

    deleteAll() {
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].split("=");
            this.delete(cookie[0]);
        }
    }

}