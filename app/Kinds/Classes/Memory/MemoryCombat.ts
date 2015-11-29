class MemoryCombat extends Memory {
    private roundCounter : number = 0;
    private currentParticipant : number = 0;
    private buffs : { [id : string] : Buff} = {};

    constructor () {
        super([0]);
    }

    public getBuffs () {
        var buffs = [];
        for (var id in this.buffs) {
            buffs.push(this.buffs[id].exportAsObject());
        }
        return buffs;
    }

    public getFunction = function () {
        return [
            this.roundCounter,
            this.currentParticipant,
            this.getBuffs()
        ];
    }

    public setFunction = function (value : Array<any>) {
        this.roundCounter = value[0];
        this.currentParticipant = value[1];

    }
}