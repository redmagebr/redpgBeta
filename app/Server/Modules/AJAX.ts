/**
 * Created by Reddo on 14/09/2015.
 */
module Server.AJAX {
    export function requestPage (ajax : AJAXConfig, success, error) {
        var url = ajax.url;
        // Relative URL?
        if (url.indexOf("://") === -1) {
            url = Server.APPLICATION_URL + url;

            // Include session in link?
            if (Application.Login.hasSession()) {
                url += ';jsessionid=' + Application.Login.getSession();
            }
        }

        var xhr = new XMLHttpRequest();
        var method = ajax.data !== null ? "POST" : "GET";
        xhr.open(method, <string> url, true);
        xhr.responseType = ajax.responseType;

        xhr.addEventListener("loadend", {
            ajax : ajax,
            handleEvent : function (e : Event) {
                console.debug("AJAX request for " + this.ajax.url + " is complete.");
                if (this.ajax.target !== this.ajax.TARGET_NONE) {
                    if (this.ajax.target === this.ajax.TARGET_GLOBAL) {
                        UI.Loading.stopLoading();
                    } else if (this.ajax.target === this.ajax.TARGET_LEFT) {
                        UI.Loading.unblockLeft();
                    } else if (this.ajax.target === this.ajax.TARGET_RIGHT) {
                        UI.Loading.unblockRight();
                    }
                }
            }
        });

        xhr.addEventListener("load", {
            xhr : xhr,
            ajax : ajax,
            success : success,
            error : error,
            handleEvent : function (e) {
                if (this.xhr.status >= 200 && this.xhr.status < 300) {
                    console.debug("[SUCCESS]: AJAX (" + this.ajax.url + ")...", {Status : this.xhr.status, XHR: this.xhr});
                    this.success.handleEvent(this.xhr.response, this.xhr);
                } else {
                    console.error("[ERROR]: AJAX (" + this.ajax.url + ")...", {Status : this.xhr.status, XHR: this.xhr});
                    this.error.handleEvent(this.xhr.response, this.xhr);
                }
            }
        });

        xhr.addEventListener("error", {
            xhr : xhr,
            ajax : ajax,
            error : error,
            handleEvent : function (e : Event) {
                console.error("[ERROR] AJAX call for " + this.ajax.url + " resulted in network error. Event, XHR:", e, this.xhr);
                this.error.handleEvent(e, this.xhr);
            }
        });

        if (ajax.target !== ajax.TARGET_NONE) {
            if (ajax.target === ajax.TARGET_GLOBAL) {
                UI.Loading.startLoading();
            } else if (ajax.target === ajax.TARGET_LEFT) {
                UI.Loading.blockLeft();
            } else if (ajax.target === ajax.TARGET_RIGHT) {
                UI.Loading.blockRight();
            }
        }

        if (ajax.data !== null) {
            var data = {};

            for (var key in ajax.data) {
                if (typeof ajax.data[key] === "number" || typeof ajax.data[key] === "string") {
                    data[key] = ajax.data[key];
                } else {
                    data[key] = JSON.stringify(ajax.data[key]);
                }
            }

            console.debug("Ajax request for " + url + " includes Data. Data:", data);

            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send($.param(data));
        } else {
            xhr.send();
        }
    }
}