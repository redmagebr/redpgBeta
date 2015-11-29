class UserGameContext {
    private user : User;
    private gameid : number;

    constructor (user : User) {
        this.user = user;
    }

    public createRoom : boolean;
    public createSheet : boolean;
    public editSheet : boolean;
    public viewSheet : boolean;
    public deleteSheet : boolean;

    public invite : boolean;
    public promote : boolean;

    public getUser () {
        return this.user;
    }

    public updateFromObject (obj : {[id : string] : any}) {
        for (var id in this) {
            if (obj[id] !== undefined) {
                this[id] = obj[id];
            }
        }
    }
}