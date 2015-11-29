class Buff {
    public target : number = 0;
    public applier : number = 0;
    public appliedRound : number = 0;
    public duration : number = 0;
    public name : string = "";
    public beginning : number = 0;

    public setTarget (id : number) {
        this.target = id;
    }

    public setApplier (id : number) {
        this.applier = id;
    }

    public setAppliedRound (round : number) {
        this.appliedRound = round;
    }

    public setName (name : string) {
        this.name = name;
    }

    public setBeginning (begins : boolean | number) {
        if (begins === true || begins === 1) {
            this.beginning = 1;
        } else {
            this.beginning = 0;
        }
    }

    public setDuration (dur : number) {
        this.duration = dur;
    }

    public isActive (partId : number, round : number, beginning : boolean) {
        var begins = beginning ? 1 : 0;
        var lastRound = (this.appliedRound + this.duration);
        if (round > lastRound || (round === lastRound && this.beginning === begins)) {
            return false;
        }
        return true;
    }

    public exportId () {
        return JSON.stringify(this.exportAsObject());
    }

    public updateFromObject (obj : Array<any>) {
        this.setTarget(obj[0]);
        this.setApplier(obj[1]);
        this.setAppliedRound(obj[2]);
        this.setDuration(obj[3]);
        this.setBeginning(obj[4]);
        this.setName(obj[5]);
    }

    public exportAsObject () {
        return [this.target, this.applier, this.appliedRound, this.duration, this.beginning, this.name];
    }
}