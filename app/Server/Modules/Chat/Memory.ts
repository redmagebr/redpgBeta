module Server.Chat.Memory {
    var configList : { [id : string] : Memory } = {};

    export function getConfig (id : string) : Memory {
        return configList[id];
    }

    export function registerChangeListener (id : string, listener : Listener) {
        if (configList[id] === undefined) {
            console.warn("[ROOMMEMORY] Attempt to register a listener to unregistered configuration at " + id + ". Offending listener:", listener);
            return;
        }
        configList[id].addChangeListener(listener);
    }

    export function registerConfiguration (id : string, config : Memory) {
        if (configList[id] !== undefined) {
            console.warn("[ROOMMEMORY] Attempt to overwrite registered Configuration at " + id + ". Offending configuration:", config);
            return;
        }

        configList[id] = config;
    }

    export function exportAsObject () : { [id : string] : any } {
        var result : { [id : string] : any } = {};

        for (var key in configList) {
            result[key] = configList[key].getValue();
        }

        return result;
    }

    export function updateFromObject (obj : {[id : string] : any}) {
        for (var key in configList) {
            if (obj[key] === undefined) {
                configList[key].reset();
            } else {
                configList[key].storeValue(obj[key]);
            }
        }
        console.debug("[ROOMMEMORY] Updated values from:", obj);
    }
}