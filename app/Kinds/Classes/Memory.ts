class Memory {
    private changeListeners : Array <Listener> = [];
    protected value : any = null;
    public defValue : any = null;

    public setFunction : Function = null;
    public getFunction : Function = null;

    constructor (defV : any) {
        this.defValue = defV;
        this.value = defV;
    }

    public getDefault () {
        return this.defValue;
    }

    public reset () {
        this.value = this.defValue;
    }

    public addChangeListener (listener : Listener) {
        this.changeListeners.push(listener);
    }

    public storeValue (value : any) {
        var oldValue = JSON.stringify(this.value);
        if (this.setFunction !== null) {
            this.setFunction(value);
        } else {
            this.value = value;
        }
        var newValue = JSON.stringify(this.value);

        if (newValue !== oldValue) {
            for (var i = 0; i < this.changeListeners.length; i++) {
                this.changeListeners[i].handleEvent(this);
            }
            return true;
        }
        return false;
    }

    public getValue () {
        if (this.getFunction !== null) {
            return this.getFunction();
        }
        return this.value;
    }
}