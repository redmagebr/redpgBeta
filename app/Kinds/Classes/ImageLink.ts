class ImageLink implements ImageInt {
    private name :string;
    private id : number;
    private url : string;

    public getLink () {
        return this.url;
    }

    public getId () {
        return this.id.toString();
    }

    public getName () {
        return this.name;
    }
}