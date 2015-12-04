module Server.Storage {
    var STORAGE_URL = "Storage";
    var validStorage = ["sounds", "images", "custom1", "custom2"];

    var emptyCallback = <Listener> {handleEvent:function(){}};

    export function requestSounds (ajaxTarget : number,  cbs? : Listener, cbe? : Listener) {
        requestStorage("sounds", ajaxTarget, cbs, cbe);
    }

    export function requestImages (ajaxTarget : number,  cbs? : Listener, cbe? : Listener) {
        requestStorage("images", ajaxTarget, cbs, cbe);
    }

    export function requestStorage (id : string, ajaxTarget : number,  cbs? : Listener, cbe? : Listener) {
        if (validStorage.indexOf(id) === -1) {
            console.error("[STORAGE] Attempt to access invalid storage at " + id + ".");
            cbe.handleEvent();
            return;
        }

        var success = cbs === undefined ? emptyCallback : cbs;

        var error = cbe === undefined ? emptyCallback : cbe;

        var ajax = new AJAXConfig(STORAGE_URL);
        ajax.target = ajaxTarget;
        ajax.setResponseTypeJSON();
        ajax.data = {action : "restore", id : id}; // "store"

        Server.AJAX.requestPage(ajax, success, error);
    }
}