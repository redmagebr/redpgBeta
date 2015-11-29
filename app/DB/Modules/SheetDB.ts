module DB.SheetDB {
    var sheets : {[id : number] : SheetInstance} = {};

    var changeListeners : Array<Listener> = [];

    export function addChangeListener (list : Listener) {
        this.changeListeners.push(list);
    }

    export function removeChangeListener (list : Listener) {
        var i = changeListeners.indexOf(list);
        if (i !== -1) {
            changeListeners.splice(i, 1);
        }
    }

    export function triggerChanged (sheet : SheetInstance) {
        for (var i = 0; i < this.changeListeners.length; i++) {
            this.changeListeners[i].handleEvent(sheet);
        }
    }

    export function hasSheet (id : number) {
        return sheets[id] !== undefined;
    }

    export function getSheet (id : number) : SheetInstance {
        if (hasSheet(id)) {
            return sheets[id];
        }
        return null;
    }

    export function releaseSheet (id : number) {
        if (hasSheet(id)) {
            delete (sheets[id]);
        }
    }

    export function updateFromObject (obj : Array<Object>) {
        for (var i = 0; i < obj.length; i++) {
            if (sheets[obj[i]['id']] === undefined) {
                sheets[obj[i]['id']] = new SheetInstance();
            }
            sheets[obj[i]['id']].updateFromObject(obj[i]);
        }
        triggerChanged(null);
    }
}