class UserRoomContext {
    private user : User;

    public roomid : number;

    constructor (user : User) {
        this.user = user;
    }

    public getRoom () {
        if (DB.RoomDB.hasRoom(this.roomid)) return DB.RoomDB.getRoom(this.roomid);
        return new Room();
    }

    public getUser () {
        return this.user;
    }

    private cleaner : boolean = false;
    private storyteller : boolean = false;

    public isStoryteller () : boolean {
        return this.storyteller;
    }

    public isCleaner () : boolean {
        return this.cleaner;
    }

    public updateFromObject (user : Object) {
        for (var id in this) {
            if (user[id] === undefined) continue;
            this[id] = user[id];
        }
    }

    public getUniqueNickname () : string {
        var users = this.getRoom().getOrderedUsers();
        for (var i = 0; i < users.length; i++) {
            if (users[i].id === this.getUser().id) continue;
            if (users[i].getShortNickname().toLowerCase() === this.user.getShortNickname().toLowerCase()) {
                return this.user.getFullNickname();
            }
        }
        return this.user.getShortNickname();
    }
}