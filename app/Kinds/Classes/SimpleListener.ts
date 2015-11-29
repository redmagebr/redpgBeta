class SimpleListener implements Listener {
    public handleEvent : Function = function (e) {
        console.error("[SimpleListener] Was triggered without having implemented a handleEvent.", arguments);
    };

    constructor (f : Function) {
        this.handleEvent = f;
    }

    public setValue (id : string, value : any) {
        this[id] = value;
    }

    public getValue (id : string) {
        return this[id];
    }
}