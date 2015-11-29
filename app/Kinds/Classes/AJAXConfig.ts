/**
 * Created by Reddo on 14/09/2015.
 */
class AJAXConfig {
    private _target : number = 0;
    private _url : string = "";
    private _timeout : number = 15000;
    private _responseType : string = "json";
    private _data : Object = null;

    public TARGET_NONE = 0;
    public TARGET_GLOBAL = 1;
    public TARGET_LEFT = 2;
    public TARGET_RIGHT = 3;

    constructor (url : string) {
        this._url = url;
    }

    public get target():number {
        return this._target;
    }

    public set target(value:number) {
        this._target = value;
    }

    public get url():string {
        return this._url;
    }

    public set url(value:string) {
        this._url = value;
    }

    public get timeout():number {
        return this._timeout;
    }

    public set timeout(value:number) {
        this._timeout = value;
    }

    public get responseType():string {
        return this._responseType;
    }

    public set responseType(value:string) {
        this._responseType = value;
    }

    public get data():Object {
        return this._data;
    }

    public set data(value:Object) {
        this._data = value;
    }

    public setResponseTypeJSON () {
        this._responseType = "json";
    }

    public setResponseTypeText () {
        this._responseType = "text";
    }

    public setTargetNone () {
        this._target = this.TARGET_NONE;
    }

    public setTargetGlobal () {
        this._target = this.TARGET_GLOBAL;
    }

    public setTargetLeftWindow () {
        this._target = this.TARGET_LEFT;
    }

    public setTargetRightWindow () {
        this._target = this.TARGET_RIGHT;
    }
}