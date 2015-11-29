module Server {
    export var APPLICATION_URL : string = "http://app.redpg.com.br/service/";
    export var WEBSOCKET_SERVERURL : string = "ws://app.redpg.com.br";
    export var WEBSOCKET_CONTEXT : string = "/service/";
    export var WEBSOCKET_PORTS : Array<number> = [80, 8080, 8081];

    //export var APPLICATION_URL : string = "http://localhost:8080/RedPG/";
    //export var WEBSOCKET_SERVERURL : string = "ws://localhost";
    //export var WEBSOCKET_CONTEXT : string = "/RedPG/";
    //export var WEBSOCKET_PORTS : Array<number> = [8080];

    Application.Config.registerConfiguration("wsPort", new WsportConfiguration(WEBSOCKET_PORTS[0]));

    export function getWebsocketURL () : string {
        return WEBSOCKET_SERVERURL + ":" + Application.Config.getConfig("wsPort").getValue() + WEBSOCKET_CONTEXT;
    }
}