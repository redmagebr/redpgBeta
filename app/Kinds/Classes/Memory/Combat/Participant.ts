class Participant {
    public id : number = 0;
    public name : string = "";
    public playerId : number = 0;
    public initiative : number = 0;

    public exportAsObject () {
        return [this.id, this.name, this.playerId, this.initiative];
    }

    public updateFromObject (obj : Array<any>) {
        this.id = obj[0];
        this.name = obj[1];
        this.playerId = obj[2];
        this.initiative = obj[3];
    }
}