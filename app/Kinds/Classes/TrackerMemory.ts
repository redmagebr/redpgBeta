class TrackerMemory {
    private changeTrigger = new Trigger();

    public reset () {
        console.error("[TrackerMemory] Reset is abstract. Offending class: ",  this.constructor['name'], this);
    }

    public storeValue (value : any) : any {
        console.error("[TrackerMemory] StoreValue is abstract. Offending class: ",  this.constructor['name'], this);
    }

    public getValue () : any {
        console.error("[TrackerMemory] StoreValue is abstract. Offending class: ",  this.constructor['name'], this);
    }

    public exportAsObject () : any {
        console.error("[TrackerMemory] ExportAsObject is abstract. Offending class: ",  this.constructor['name'], this);
    }

    public addChangeListener (listener : Listener | Function) {
        this.changeTrigger.addListener(listener);
    }

    protected triggerChange () {
        this.changeTrigger.trigger(this);
    }
}