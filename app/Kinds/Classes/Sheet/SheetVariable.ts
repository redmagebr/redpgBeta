class SheetVariable {
    public id : string;
    public parent : Sheet;
    public style : SheetStyle;
    protected visible : HTMLElement;
    protected value : any = null;

    protected changeTrigger : Trigger = new Trigger();

    constructor (parent : Sheet, style : SheetStyle, ele : HTMLElement) {
        this.parent = parent;
        this.style = style;
        this.visible = ele;

        this.id = ele.dataset['id'] === undefined ? this.style.getUniqueID() : ele.dataset['id'];
    }

    public storeValue (val : any) {
        if (val !== this.value) {
            this.value = val;

            this.style.triggerVariableChange(this);
        }
    }

    public triggerChange (counter : number) {
        this.changeTrigger.trigger(this, counter);
    }

    public getValue () {
        return this.value;
    }

    public exportObject () {
        return this.value;
    }

    public addOnChange (f : Function | Listener) {
        this.changeTrigger.addListener(f);
    }
}