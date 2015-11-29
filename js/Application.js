function startDebugging() {
    console.debug = console.log;
}
function stopDebugging() {
    console.debug = function () {
    };
}
if (window.location.hash.substr(1).toUpperCase().indexOf("DEBUG") !== -1) {
    startDebugging();
}
else {
    stopDebugging();
}
var onReady = [];
function addOnReady(caller, reason, listener) {
    console.debug("[ONREADY] Registered for " + caller + " because: " + reason + ". Listener:", listener);
    onReady.push(listener);
}
function allReady() {
    for (var i = 0; i < onReady.length; i++) {
        onReady[i].handleEvent();
    }
}
var User = (function () {
    function User() {
        this.nickname = "Undefined";
        this.nicknamesufix = "????";
        this.id = null;
        this.level = null;
        this.gameContexts = {};
        this.roomContexts = {};
    }
    User.prototype.isMe = function () {
        return this.id === Application.getMyId();
    };
    User.prototype.getGameContext = function (id) {
        if (this.gameContexts[id] === undefined) {
            return null;
        }
        return this.gameContexts[id];
    };
    User.prototype.releaseGameContext = function (id) {
        delete (this.gameContexts[id]);
    };
    User.prototype.getRoomContext = function (id) {
        if (this.roomContexts[id] === undefined) {
            return null;
        }
        return this.roomContexts[id];
    };
    User.prototype.releaseRoomContext = function (id) {
        delete (this.roomContexts[id]);
    };
    User.prototype.getFullNickname = function () {
        return this.nickname + "#" + this.nicknamesufix;
    };
    User.prototype.getShortNickname = function () {
        return this.nickname;
    };
    User.prototype.updateFromObject = function (user) {
        if (typeof user['id'] === "string") {
            user['id'] = parseInt(user['id']);
        }
        for (var key in this) {
            if (user[key] === undefined)
                continue;
            this[key] = user[key];
        }
        var context;
        if (user['roomid'] !== undefined) {
            context = this.getRoomContext(user['roomid']);
            if (context === null) {
                context = new UserRoomContext(this);
                this.roomContexts[user['roomid']] = context;
            }
            context.updateFromObject(user);
        }
        if (user['gameid'] !== undefined) {
            context = this.getGameContext(user['roomid']);
            if (context === null)
                context = new UserGameContext(this);
            context.updateFromObject(user);
        }
    };
    return User;
})();
var UserGameContext = (function () {
    function UserGameContext(user) {
        this.user = user;
    }
    UserGameContext.prototype.getUser = function () {
        return this.user;
    };
    UserGameContext.prototype.updateFromObject = function (obj) {
        for (var id in this) {
            if (obj[id] !== undefined) {
                this[id] = obj[id];
            }
        }
    };
    return UserGameContext;
})();
var UserRoomContext = (function () {
    function UserRoomContext(user) {
        this.cleaner = false;
        this.storyteller = false;
        this.user = user;
    }
    UserRoomContext.prototype.getRoom = function () {
        if (DB.RoomDB.hasRoom(this.roomid))
            return DB.RoomDB.getRoom(this.roomid);
        return new Room();
    };
    UserRoomContext.prototype.getUser = function () {
        return this.user;
    };
    UserRoomContext.prototype.isStoryteller = function () {
        return this.storyteller;
    };
    UserRoomContext.prototype.isCleaner = function () {
        return this.cleaner;
    };
    UserRoomContext.prototype.updateFromObject = function (user) {
        for (var id in this) {
            if (user[id] === undefined)
                continue;
            this[id] = user[id];
        }
    };
    UserRoomContext.prototype.getUniqueNickname = function () {
        var users = this.getRoom().getOrderedUsers();
        for (var i = 0; i < users.length; i++) {
            if (users[i].id === this.getUser().id)
                continue;
            if (users[i].getShortNickname().toLowerCase() === this.user.getShortNickname().toLowerCase()) {
                return this.user.getFullNickname();
            }
        }
        return this.user.getShortNickname();
    };
    return UserRoomContext;
})();
var Room = (function () {
    function Room() {
        this.gameid = null;
        this.id = null;
        this.description = null;
        this.name = null;
        this.playByPost = null;
        this.privateRoom = null;
        this.users = {};
        this.messages = {};
    }
    Room.prototype.getOrderedMessages = function () {
        var list = [];
        for (var id in this.messages) {
            list.push(this.messages[id]);
        }
        list.sort(function (a, b) {
            return a.id - b.id;
        });
        return list;
    };
    Room.prototype.getOrderedUsers = function () {
        var list = [];
        for (var id in this.users) {
            list.push(this.users[id]);
        }
        list.sort(function (a, b) {
            var na = a.getShortNickname().toLowerCase();
            var nb = b.getShortNickname().toLowerCase();
            if (na < nb)
                return -1;
            if (nb < na)
                return 1;
            na = a.getFullNickname().toLowerCase();
            nb = b.getFullNickname().toLowerCase();
            if (na < nb)
                return -1;
            if (nb < na)
                return 1;
            return 0;
        });
        return list;
    };
    Room.prototype.getStorytellers = function () {
        var storytellers = [];
        for (var id in this.users) {
            var rc = this.users[id].getRoomContext(this.id);
            if (rc !== null && rc.isStoryteller()) {
                storytellers.push(rc);
            }
        }
        return storytellers;
    };
    Room.prototype.getUser = function (id) {
        if (this.users[id] === undefined) {
            return null;
        }
        return this.users[id].getRoomContext(this.id);
    };
    Room.prototype.getUsersByName = function (str) {
        var list = [];
        str = str.toLowerCase();
        for (var id in this.users) {
            if (this.users[id].getFullNickname().toLowerCase().indexOf(str) !== -1) {
                list.push(this.users[id].getRoomContext(this.id));
            }
        }
        return list;
    };
    Room.prototype.getMe = function () {
        return this.getUser(Application.Login.getUser().id);
    };
    Room.prototype.getGame = function () {
        return DB.GameDB.getGame(this.gameid);
    };
    Room.prototype.updateFromObject = function (room, cleanup) {
        for (var id in this) {
            if (room[id] === undefined || id === "users" || id === 'messages')
                continue;
            this[id] = room[id];
        }
        if (room['users'] !== undefined) {
            var cleanedup = [];
            for (var i = 0; i < room['users'].length; i++) {
                room['users'][i]['roomid'] = this.id;
            }
            DB.UserDB.updateFromObject(room['users']);
            for (var i = 0; i < room['users'].length; i++) {
                this.users[room['users'][i]['id']] = DB.UserDB.getUser(room['users'][i]['id']);
                cleanedup.push(room['users'][i]['id']);
            }
            if (cleanup) {
                for (var id in this.users) {
                    if (cleanedup.indexOf(this.users[id].id) === -1) {
                        this.users[id].releaseGameContext(this.id);
                        delete (this.users[id]);
                    }
                }
            }
        }
        if (room['messages'] !== undefined) {
            var cleanedup = [];
            for (var i = 0; i < room['messages'].length; i++) {
                room['messages'][i]['roomid'] = this.id;
                cleanedup.push(room['messages'][i].id);
            }
            DB.MessageDB.updateFromObject(room['messages']);
            for (var i = 0; i < cleanedup.length; i++) {
                if (this.messages[cleanedup[i]] === undefined) {
                    this.messages[cleanedup[i]] = DB.MessageDB.getMessage(cleanedup[i]);
                }
            }
            if (cleanup) {
                for (id in this.messages) {
                    if (cleanedup.indexOf(this.messages[id].id) === -1) {
                        if (this.messages[id].localid !== null) {
                            DB.MessageDB.releaseLocalMessage(this.messages[id].localid);
                        }
                        DB.MessageDB.releaseMessage(this.messages[id].id);
                    }
                }
            }
        }
    };
    return Room;
})();
var Game = (function () {
    function Game() {
        this.users = {};
        this.rooms = {};
        this.sheets = {};
        this.description = null;
        this.name = null;
        this.id = null;
        this.freejoin = null;
        this.creatorid = null;
        this.creatornick = null;
        this.creatorsufix = null;
    }
    Game.prototype.getUser = function (id) {
        if (this.users[id] === undefined) {
            return null;
        }
        return this.users[id].getGameContext(this.id);
    };
    Game.prototype.getRoom = function (id) {
        if (this.rooms[id] === undefined) {
            return null;
        }
        return this.rooms[id];
    };
    Game.prototype.getSheet = function (id) {
        if (this.sheets[id] === undefined) {
            return null;
        }
        return this.sheets[id];
    };
    Game.prototype.getOrderedRoomList = function () {
        var list = [];
        for (var id in this.rooms) {
            list.push(this.rooms[id]);
        }
        list.sort(function (a, b) {
            var na = a.name.toLowerCase();
            var nb = b.name.toLowerCase();
            if (na < nb)
                return -1;
            if (nb < na)
                return 1;
            return 0;
        });
        return list;
    };
    Game.prototype.getOrderedSheetList = function () {
        var list = [];
        for (var id in this.sheets) {
            list.push(this.sheets[id]);
        }
        list.sort(function (a, b) {
            var na = a.name.toLowerCase();
            var nb = b.name.toLowerCase();
            if (na < nb)
                return -1;
            if (nb < na)
                return 1;
            return 0;
        });
        return list;
    };
    Game.prototype.updateFromObject = function (game, cleanup) {
        for (var id in this) {
            if (game[id] === undefined || id === "users" || id === "rooms")
                continue;
            this[id] = game[id];
        }
        if (game['users'] !== undefined) {
            var cleanedup = [];
            for (var i = 0; i < game['users'].length; i++) {
                game['users'][i]['gameid'] = this.id;
            }
            DB.UserDB.updateFromObject(game['users']);
            for (var i = 0; i < game['users'].length; i++) {
                this.users[game['users'][i]['id']] = DB.UserDB.getUser(game['users'][i]['id']);
                cleanedup.push(game['users'][i]['id']);
            }
            if (cleanup) {
                for (id in this.users) {
                    if (cleanedup.indexOf(this.users[id].id) === -1) {
                        this.users[id].releaseGameContext(this.id);
                        delete (this.users[id]);
                    }
                }
            }
        }
        if (game['rooms'] !== undefined) {
            var cleanedup = [];
            for (var i = 0; i < game['rooms'].length; i++) {
                game['rooms'][i]['gameid'] = this.id;
            }
            DB.RoomDB.updateFromObject(game['rooms'], false);
            for (var i = 0; i < game['rooms'].length; i++) {
                this.rooms[game['rooms'][i]['id']] = DB.RoomDB.getRoom(game['rooms'][i]['id']);
                cleanedup.push(game['rooms'][i]['id']);
            }
            if (cleanup) {
                for (id in this.rooms) {
                    if (cleanedup.indexOf(this.rooms[id].id) === -1) {
                        DB.RoomDB.releaseRoom(this.rooms[id].id);
                        delete (this.users[id]);
                    }
                }
            }
        }
        if (game['sheets'] !== undefined) {
            var cleanedup = [];
            for (var i = 0; i < game['rooms'].length; i++) {
                game['sheets'][i]['gameid'] = this.id;
            }
            DB.SheetDB.updateFromObject(game['sheets']);
            for (var i = 0; i < game['sheets'].length; i++) {
                this.sheets[game['sheets'][i]['id']] = DB.SheetDB.getSheet(game['sheets'][i]['id']);
                cleanedup.push(game['sheets'][i]['id']);
            }
            if (cleanup) {
                for (id in this.sheets) {
                    if (cleanedup.indexOf(this.sheets[id].id) === -1) {
                        DB.SheetDB.releaseSheet(this.sheets[id].id);
                        delete (this.sheets[id]);
                    }
                }
            }
        }
    };
    return Game;
})();
var SheetInstance = (function () {
    function SheetInstance() {
        this.id = 0;
        this.gameid = 0;
        this.folder = "";
        this.name = "";
        this.values = {};
        this.lastValues = "{}";
        this.creator = null;
        this.creatorNickname = "???#???";
        this.styleId = 0;
        this.styleName = "?";
        this.styleCreator = 0;
        this.styleCreatorNickname = "???#???";
        this.styleSafe = false;
        this.view = true;
        this.edit = false;
        this.delete = false;
        this.promote = false;
        this.isPublic = false;
        this.changed = false;
        this.changeListeners = [];
    }
    SheetInstance.prototype.addChangeListener = function (list) {
        this.changeListeners.push(list);
    };
    SheetInstance.prototype.triggerChanged = function () {
        for (var i = 0; i < this.changeListeners.length; i++) {
            this.changeListeners[i].handleEvent(this);
        }
        DB.SheetDB.triggerChanged(this);
    };
    SheetInstance.prototype.getMemoryId = function () {
        return "sheetBackup_" + this.id;
    };
    SheetInstance.prototype.setSaved = function () {
        this.changed = false;
        Application.LocalMemory.unsetMemory(this.getMemoryId());
    };
    SheetInstance.prototype.setName = function (name) {
        if (name !== this.name) {
            this.changed = true;
            this.name = name;
            this.triggerChanged();
        }
    };
    SheetInstance.prototype.setValues = function (values, local) {
        // Local values = user changed them NOW.
        // Not local = saved on server.
        var newJson = JSON.stringify(values);
        if (newJson !== this.lastValues) {
            this.values = values;
            this.lastValues = newJson;
            this.changed = true;
        }
        if (this.changed) {
            if (local) {
                Application.LocalMemory.setMemory(this.getMemoryId(), newJson);
            }
            else {
                this.changed = false;
            }
            this.triggerChanged();
        }
    };
    SheetInstance.prototype.updateFromObject = function (obj) {
        if (typeof obj['id'] !== 'undefined')
            this.id = obj['id'];
        if (typeof obj['gameid'] !== 'undefined')
            this.gameid = obj['gameid'];
        if (typeof obj['nome'] !== 'undefined')
            this.name = obj['nome'];
        if (typeof obj['criadorNick'] !== 'undefined' && typeof obj['criadorNickSufix'] !== 'undefined')
            this.creatorNickname = obj['criadorNick'] + "#" + obj['criadorNickSufix'];
        if (typeof obj['criador'] !== 'undefined')
            this.creator = obj['criador'];
        if (typeof obj['folder'] !== 'undefined')
            this.folder = obj['folder'];
        if (typeof obj['publica'] !== 'undefined')
            this.isPublic = obj['publica'];
        if (typeof obj['visualizar'] !== 'undefined')
            this.view = obj['visualizar'];
        if (typeof obj['deletar'] !== 'undefined')
            this.delete = obj['deletar'];
        if (typeof obj['editar'] !== 'undefined')
            this.edit = obj['editar'];
        if (typeof obj['promote'] !== 'undefined')
            this.promote = obj['promote'];
        if (typeof obj['nickStyleCreator'] !== 'undefined' && typeof obj['nicksufixStyleCreator'] !== 'undefined')
            this.styleCreatorNickname = obj['nickStyleCreator'] + "#" + obj['nicksufixStyleCreator'];
        if (typeof obj['idStyleCreator'] !== 'undefined')
            this.styleCreator = obj['idStyleCreator'];
        if (typeof obj['idstyle'] !== 'undefined')
            this.styleId = obj['idstyle'];
        if (typeof obj['styleName'] !== 'undefined')
            this.styleName = obj['styleName'];
        if (typeof obj['segura'] !== 'undefined')
            this.styleSafe = obj['segura'];
        if (typeof obj['values'] !== 'undefined')
            this.setValues(obj['values'], false);
    };
    return SheetInstance;
})();
var SimpleListener = (function () {
    function SimpleListener(f) {
        this.handleEvent = function (e) {
            console.error("[SimpleListener] Was triggered without having implemented a handleEvent.", arguments);
        };
        this.handleEvent = f;
    }
    SimpleListener.prototype.setValue = function (id, value) {
        this[id] = value;
    };
    SimpleListener.prototype.getValue = function (id) {
        return this[id];
    };
    return SimpleListener;
})();
var AJAXConfig = (function () {
    function AJAXConfig(url) {
        this._target = 0;
        this._url = "";
        this._timeout = 15000;
        this._responseType = "json";
        this._data = null;
        this.TARGET_NONE = 0;
        this.TARGET_GLOBAL = 1;
        this.TARGET_LEFT = 2;
        this.TARGET_RIGHT = 3;
        this._url = url;
    }
    Object.defineProperty(AJAXConfig.prototype, "target", {
        get: function () {
            return this._target;
        },
        set: function (value) {
            this._target = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AJAXConfig.prototype, "url", {
        get: function () {
            return this._url;
        },
        set: function (value) {
            this._url = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AJAXConfig.prototype, "timeout", {
        get: function () {
            return this._timeout;
        },
        set: function (value) {
            this._timeout = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AJAXConfig.prototype, "responseType", {
        get: function () {
            return this._responseType;
        },
        set: function (value) {
            this._responseType = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AJAXConfig.prototype, "data", {
        get: function () {
            return this._data;
        },
        set: function (value) {
            this._data = value;
        },
        enumerable: true,
        configurable: true
    });
    AJAXConfig.prototype.setResponseTypeJSON = function () {
        this._responseType = "json";
    };
    AJAXConfig.prototype.setResponseTypeText = function () {
        this._responseType = "text";
    };
    AJAXConfig.prototype.setTargetNone = function () {
        this._target = this.TARGET_NONE;
    };
    AJAXConfig.prototype.setTargetGlobal = function () {
        this._target = this.TARGET_GLOBAL;
    };
    AJAXConfig.prototype.setTargetLeftWindow = function () {
        this._target = this.TARGET_LEFT;
    };
    AJAXConfig.prototype.setTargetRightWindow = function () {
        this._target = this.TARGET_RIGHT;
    };
    return AJAXConfig;
})();
var WebsocketController = (function () {
    function WebsocketController(url) {
        this.socket = null;
        this.keepAlive = true;
        this.keepAliveTime = 15 * 1000;
        this.keepAliveInterval = null;
        this.onOpen = [];
        this.onClose = [];
        this.onMessage = [];
        this.onError = [];
        this.url = url;
    }
    WebsocketController.prototype.connect = function () {
        if (this.isReady()) {
            console.warn("[WEBSOCKET] Attempt to connect a WebSocket that was already connected. Disconnecting first.");
            this.close();
        }
        var url = Server.getWebsocketURL() + this.url;
        if (Application.Login.hasSession()) {
            url += ';jsessionid=' + Application.Login.getSession();
        }
        this.socket = new WebSocket(url);
        this.socket.addEventListener("open", {
            controller: this,
            handleEvent: function (e) {
                this.controller.resetInterval();
                this.controller.triggerOpen();
                console.debug("[WEBSOCKET] " + this.controller.url + ": Open.", e);
            }
        });
        this.socket.addEventListener("error", {
            controller: this,
            handleEvent: function (e) {
                console.error("[WEBSOCKET] " + this.controller.url + ": Error.", e);
            }
        });
        this.socket.addEventListener("message", {
            controller: this,
            handleEvent: function (e) {
                this.controller.resetInterval();
                if (e.data === "1") {
                    console.warn("KEEPALIVE USED!");
                }
                if (e.data !== "1" && e.data.indexOf("[\"status") !== 0)
                    console.debug("[WEBSOCKET] " + this.controller.url + ": Message: ", e);
                this.controller.triggerMessage(e);
            }
        });
        this.socket.addEventListener("close", {
            controller: this,
            handleEvent: function (e) {
                this.controller.disableInterval();
                this.controller.triggerClose();
                console.warn("[WEBSOCKET] " + this.controller.url + ": Closed.", e);
            }
        });
    };
    WebsocketController.prototype.isReady = function () {
        return this.socket !== null && this.socket.readyState === WebsocketController.READYSTATE_OPEN;
    };
    WebsocketController.prototype.resetInterval = function () {
        if (this.keepAlive) {
            if (this.keepAliveInterval !== null) {
                clearInterval(this.keepAliveInterval);
            }
            var interval = function (controller) {
                controller.doKeepAlive();
            };
            this.keepAliveInterval = setInterval(interval.bind(null, this), this.keepAliveTime);
        }
    };
    WebsocketController.prototype.disableInterval = function () {
        if (this.keepAliveInterval !== null) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    };
    WebsocketController.prototype.doKeepAlive = function () {
        this.socket.send("0");
    };
    WebsocketController.prototype.send = function (action, obj) {
        if (this.isReady()) {
            if (typeof obj !== "string") {
                obj = JSON.stringify(obj);
            }
            this.socket.send(action + ";" + obj);
            if (action !== "status")
                console.debug("[WEBSOCKET] Message sent:", action + ";" + obj);
        }
        else {
            console.warn("[WEBSOCKET] Attempt to send messages through a WebSocket that isn't ready. Ignoring. Offending message: ", action, obj);
        }
    };
    WebsocketController.prototype.close = function () {
        this.socket.close();
    };
    WebsocketController.prototype.addCloseListener = function (obj) {
        this.onClose.push(obj);
    };
    WebsocketController.prototype.addOpenListener = function (obj) {
        this.onOpen.push(obj);
    };
    WebsocketController.prototype.addMessageListener = function (type, obj) {
        this.onMessage.push({
            type: type,
            obj: obj,
            handleEvent: function (e) {
                var response = JSON.parse(e.data);
                if (Array.isArray(response) && response[0] === this.type) {
                    obj.handleEvent(response);
                }
            }
        });
    };
    WebsocketController.prototype.triggerOpen = function () {
        for (var i = 0; i < this.onOpen.length; i++) {
            this.onOpen[i].handleEvent();
        }
    };
    WebsocketController.prototype.triggerClose = function () {
        for (var i = 0; i < this.onClose.length; i++) {
            this.onClose[i].handleEvent();
        }
    };
    WebsocketController.prototype.triggerMessage = function (e) {
        for (var i = 0; i < this.onMessage.length; i++) {
            this.onMessage[i].handleEvent(e);
        }
    };
    WebsocketController.READYSTATE_OPEN = 1;
    return WebsocketController;
})();
var ChatWsController = (function () {
    function ChatWsController() {
        this.socket = new WebsocketController(Server.Chat.CHAT_URL);
        this.currentRoom = null;
        this.onReady = null;
        this.socket.addOpenListener({
            controller: this,
            handleEvent: function () {
                if (this.controller.onReady !== null) {
                    this.controller.onReady.handleEvent();
                    this.controller.onReady = null;
                }
            }
        });
    }
    ChatWsController.prototype.isReady = function () {
        return this.socket.isReady();
    };
    ChatWsController.prototype.start = function () {
        this.socket.connect();
    };
    ChatWsController.prototype.end = function () {
        this.currentRoom = null;
        this.socket.close();
    };
    ChatWsController.prototype.enterRoom = function (id) {
        this.socket.send("room", id);
        this.currentRoom = id;
    };
    ChatWsController.prototype.sendStatus = function (info) {
        var status = [];
        status.push(info.typing ? "1" : "0");
        status.push(info.afk ? "1" : "0");
        status.push(info.focused ? "1" : "0");
        this.socket.send("status", status.join(","));
    };
    ChatWsController.prototype.sendPersona = function (info) {
        var persona = {
            persona: info.persona,
            avatar: info.avatar
        };
        this.socket.send("persona", JSON.stringify(persona));
    };
    ChatWsController.prototype.sendMessage = function (message) {
        this.socket.send("message", message.exportAsObject());
    };
    ChatWsController.prototype.addCloseListener = function (obj) {
        this.socket.addCloseListener(obj);
    };
    ChatWsController.prototype.addOpenListener = function (obj) {
        this.socket.addOpenListener(obj);
    };
    ChatWsController.prototype.addMessageListener = function (type, obj) {
        this.socket.addMessageListener(type, obj);
    };
    return ChatWsController;
})();
var Configuration = (function () {
    function Configuration(defV) {
        this.changeListeners = [];
        this.value = null;
        this.defValue = null;
        this.setFunction = null;
        this.getFunction = null;
        this.defValue = defV;
        this.value = defV;
    }
    Configuration.prototype.getDefault = function () {
        return this.defValue;
    };
    Configuration.prototype.reset = function () {
        this.value = this.defValue;
    };
    Configuration.prototype.addChangeListener = function (listener) {
        this.changeListeners.push(listener);
    };
    Configuration.prototype.storeValue = function (value) {
        var oldValue = JSON.stringify(this.value);
        if (this.setFunction !== null) {
            this.setFunction(value);
        }
        else {
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
    };
    Configuration.prototype.getValue = function () {
        if (this.getFunction !== null) {
            return this.getFunction();
        }
        return this.value;
    };
    return Configuration;
})();
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var NumberConfiguration = (function (_super) {
    __extends(NumberConfiguration, _super);
    function NumberConfiguration(defValue, min, max) {
        _super.call(this, defValue);
        this.min = 0;
        this.max = 100;
        this.setFunction = function (value) {
            if (!isNaN(value)) {
                value = Math.floor(value);
                if (value < this.min) {
                    value = this.min;
                }
                if (value > this.max) {
                    value = this.max;
                }
                this.value = value;
            }
        };
        this.getFunction = function () {
            if ($.browser.mobile) {
                return 0;
            }
            return this.value;
        };
        this.min = min;
        this.max = max;
    }
    return NumberConfiguration;
})(Configuration);
var WsportConfiguration = (function (_super) {
    __extends(WsportConfiguration, _super);
    function WsportConfiguration() {
        _super.apply(this, arguments);
        this.setFunction = function (value) {
            if (Server.WEBSOCKET_PORTS.indexOf(value) === -1) {
                this.value = Server.WEBSOCKET_PORTS[0];
            }
            else {
                this.value = value;
            }
        };
    }
    return WsportConfiguration;
})(Configuration);
var LanguageConfiguration = (function (_super) {
    __extends(LanguageConfiguration, _super);
    function LanguageConfiguration() {
        _super.call(this, navigator.language);
        this.setFunction = function (value) {
            if (value.indexOf("_") !== -1) {
                value = value.replace("_", "-");
            }
            this.value = value;
        };
    }
    return LanguageConfiguration;
})(Configuration);
var BooleanConfiguration = (function (_super) {
    __extends(BooleanConfiguration, _super);
    function BooleanConfiguration(bool) {
        _super.call(this, bool ? 1 : 0);
        this.setFunction = function (value) {
            if (typeof value !== "string")
                value = value.toString().toLowerCase();
            var bool = value === "1" || value === "true";
            if (bool)
                this.value = 1;
            else
                this.value = 0;
        };
        this.getFunction = function () {
            return this.value === 1;
        };
    }
    return BooleanConfiguration;
})(Configuration);
var Memory = (function () {
    function Memory(defV) {
        this.changeListeners = [];
        this.value = null;
        this.defValue = null;
        this.setFunction = null;
        this.getFunction = null;
        this.defValue = defV;
        this.value = defV;
    }
    Memory.prototype.getDefault = function () {
        return this.defValue;
    };
    Memory.prototype.reset = function () {
        this.value = this.defValue;
    };
    Memory.prototype.addChangeListener = function (listener) {
        this.changeListeners.push(listener);
    };
    Memory.prototype.storeValue = function (value) {
        var oldValue = JSON.stringify(this.value);
        if (this.setFunction !== null) {
            this.setFunction(value);
        }
        else {
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
    };
    Memory.prototype.getValue = function () {
        if (this.getFunction !== null) {
            return this.getFunction();
        }
        return this.value;
    };
    return Memory;
})();
var MemoryCombat = (function (_super) {
    __extends(MemoryCombat, _super);
    function MemoryCombat() {
        _super.call(this, [0]);
        this.roundCounter = 0;
        this.currentParticipant = 0;
        this.buffs = {};
        this.getFunction = function () {
            return [
                this.roundCounter,
                this.currentParticipant,
                this.getBuffs()
            ];
        };
        this.setFunction = function (value) {
            this.roundCounter = value[0];
            this.currentParticipant = value[1];
        };
    }
    MemoryCombat.prototype.getBuffs = function () {
        var buffs = [];
        for (var id in this.buffs) {
            buffs.push(this.buffs[id].exportAsObject());
        }
        return buffs;
    };
    return MemoryCombat;
})(Memory);
var Buff = (function () {
    function Buff() {
        this.target = 0;
        this.applier = 0;
        this.appliedRound = 0;
        this.duration = 0;
        this.name = "";
        this.beginning = 0;
    }
    Buff.prototype.setTarget = function (id) {
        this.target = id;
    };
    Buff.prototype.setApplier = function (id) {
        this.applier = id;
    };
    Buff.prototype.setAppliedRound = function (round) {
        this.appliedRound = round;
    };
    Buff.prototype.setName = function (name) {
        this.name = name;
    };
    Buff.prototype.setBeginning = function (begins) {
        if (begins === true || begins === 1) {
            this.beginning = 1;
        }
        else {
            this.beginning = 0;
        }
    };
    Buff.prototype.setDuration = function (dur) {
        this.duration = dur;
    };
    Buff.prototype.isActive = function (partId, round, beginning) {
        var begins = beginning ? 1 : 0;
        var lastRound = (this.appliedRound + this.duration);
        if (round > lastRound || (round === lastRound && this.beginning === begins)) {
            return false;
        }
        return true;
    };
    Buff.prototype.exportId = function () {
        return JSON.stringify(this.exportAsObject());
    };
    Buff.prototype.updateFromObject = function (obj) {
        this.setTarget(obj[0]);
        this.setApplier(obj[1]);
        this.setAppliedRound(obj[2]);
        this.setDuration(obj[3]);
        this.setBeginning(obj[4]);
        this.setName(obj[5]);
    };
    Buff.prototype.exportAsObject = function () {
        return [this.target, this.applier, this.appliedRound, this.duration, this.beginning, this.name];
    };
    return Buff;
})();
var ChatInfo = (function () {
    function ChatInfo(floater) {
        this.textNode = document.createTextNode("null");
        this.senderBold = document.createElement("b");
        this.senderTextNode = document.createTextNode("_CHATSENDER_");
        this.storyteller = false;
        this.floater = floater;
        this.floater.style.display = "none";
        while (this.floater.firstChild !== null)
            this.floater.removeChild(this.floater.firstChild);
        this.senderBold.appendChild(this.senderTextNode);
        this.senderBold.appendChild(document.createTextNode(": "));
        this.floater.appendChild(this.senderBold);
        this.floater.appendChild(this.textNode);
        UI.Language.markLanguage(this.senderBold);
    }
    ChatInfo.prototype.showFor = function ($element, message) {
        this.floater.style.display = "";
        var offset = $element.offset().top;
        var height = window.innerHeight;
        if (message !== undefined) {
            this.floater.style.bottom = (height - offset) + "px";
            this.textNode.nodeValue = message.getUser().getUser().getFullNickname();
            if (message.getUser().isStoryteller() !== this.storyteller) {
                this.senderTextNode.nodeValue = message.getUser().isStoryteller() ? "_CHATSENDERSTORYTELLER_" : "_CHATSENDER_";
                this.storyteller = message.getUser().isStoryteller();
                UI.Language.markLanguage(this.senderBold);
            }
        }
    };
    ChatInfo.prototype.hide = function () {
        this.floater.style.display = "none";
    };
    ChatInfo.prototype.bindMessage = function (message, element) {
        if (message instanceof MessageSystem) {
            return;
        }
        var $element = $(element);
        element.addEventListener("mouseenter", {
            chatInfo: this,
            message: message,
            $element: $element,
            handleEvent: function () {
                this.chatInfo.showFor(this.$element, this.message);
            }
        });
        element.addEventListener("mousemove", {
            chatInfo: this,
            $element: $element,
            handleEvent: function () {
                this.chatInfo.showFor(this.$element);
            }
        });
        element.addEventListener("mouseleave", {
            chatInfo: this,
            handleEvent: function () {
                this.chatInfo.hide();
            }
        });
    };
    return ChatInfo;
})();
var ChatAvatar = (function () {
    function ChatAvatar() {
        this.element = document.createElement("div");
        this.img = document.createElement("img");
        this.typing = document.createElement("a");
        this.afk = document.createElement("a");
        this.name = document.createTextNode("????#????");
        this.user = null;
        this.persona = null;
        this.online = false;
        this.changedOnline = false;
        var name = document.createElement("div");
        name.classList.add("avatarName");
        name.appendChild(this.name);
        this.typing.style.display = "none";
        this.typing.classList.add("avatarTyping");
        this.afk.style.display = "none";
        this.afk.classList.add("avatarAFK");
        this.img.classList.add("avatarImg");
        this.element.classList.add("avatarContainer");
        this.element.appendChild(this.img);
        this.element.appendChild(this.typing);
        this.element.appendChild(this.afk);
        this.element.appendChild(name);
        this.img.style.display = "none";
        this.element.classList.add("icons-chatAnon");
        this.img.addEventListener("error", {
            avatar: this,
            handleEvent: function () {
                this.avatar.img.style.display = "none";
                this.avatar.element.classList.add("icons-chatAnonError");
            }
        });
    }
    ChatAvatar.prototype.getHTML = function () {
        return this.element;
    };
    ChatAvatar.prototype.getUser = function () {
        return this.user;
    };
    ChatAvatar.prototype.setOnline = function (online) {
        if (online) {
            this.element.style.display = "";
        }
        else {
            this.element.style.display = "none";
        }
        if (online !== this.online) {
            this.changedOnline = true;
            this.online = online;
        }
    };
    ChatAvatar.prototype.reset = function () {
        this.setOnline(false);
        this.changedOnline = false;
    };
    ChatAvatar.prototype.isChangedOnline = function () {
        var is = this.changedOnline;
        this.changedOnline = false;
        return is;
    };
    ChatAvatar.prototype.setImg = function (img) {
        if (img === null) {
            this.img.style.display = "none";
            this.element.classList.add("icons-chatAnon");
            this.element.classList.remove("icons-chatAnonError");
        }
        else {
            this.img.style.display = "";
            this.element.classList.remove("icons-chatAnon");
            this.element.classList.remove("icons-chatAnonError");
            this.img.src = img;
        }
    };
    ChatAvatar.prototype.setName = function (name) {
        this.name.nodeValue = name;
    };
    ChatAvatar.prototype.setFocus = function (focus) {
        if (!focus) {
            this.element.style.opacity = "0.7";
        }
        else {
            this.element.style.opacity = "1";
        }
    };
    ChatAvatar.prototype.setTyping = function (typing) {
        if (typing) {
            this.typing.style.display = "";
        }
        else {
            this.typing.style.display = "none";
        }
    };
    ChatAvatar.prototype.setAfk = function (afk) {
        if (afk) {
            this.afk.style.display = "";
        }
        else {
            this.afk.style.display = "none";
        }
    };
    ChatAvatar.prototype.updateName = function () {
        if (this.persona === null) {
            if (this.user !== null)
                this.setName(this.user.getFullNickname());
        }
        else {
            this.setName(this.persona);
        }
        if (this.user !== null) {
            this.element.setAttribute("title", this.user.getFullNickname());
        }
        else if (this.persona !== null) {
            this.element.setAttribute("title", this.persona);
        }
        else {
            this.element.removeAttribute("title");
        }
    };
    ChatAvatar.prototype.updateFromObject = function (obj) {
        if (obj['id'] !== undefined) {
            this.user = DB.UserDB.getUser(obj['id']);
        }
        if (obj['idle'] !== undefined)
            this.setAfk(obj['idle']);
        if (obj['focused'] !== undefined)
            this.setFocus(obj['focused']);
        if (obj['online'] !== undefined)
            this.setOnline(obj['online']);
        if (obj['typing'] !== undefined)
            this.setTyping(obj['typing']);
        if (obj['persona'] !== undefined)
            this.persona = obj['persona'];
        if (obj['avatar'] !== undefined)
            this.setImg(obj['avatar']);
        this.updateName();
    };
    return ChatAvatar;
})();
var ChatNotificationIcon = (function () {
    function ChatNotificationIcon(icon, hasLanguage) {
        this.element = document.createElement("div");
        this.hoverInfo = document.createElement("div");
        this.language = hasLanguage === undefined ? true : hasLanguage;
        this.element.classList.add("chatNotificationIcon");
        this.element.classList.add(icon);
        this.hoverInfo.classList.add("chatNotificationHover");
        if (this.language) {
            this.element.appendChild(this.hoverInfo);
        }
        this.element.style.display = "none";
    }
    ChatNotificationIcon.prototype.addText = function (text) {
        this.hoverInfo.appendChild(document.createTextNode(text));
    };
    ChatNotificationIcon.prototype.getElement = function () {
        if (this.language) {
            UI.Language.markLanguage(this.hoverInfo);
        }
        return this.element;
    };
    ChatNotificationIcon.prototype.show = function () {
        if (this.element.style.display === "") {
            return false;
        }
        this.element.style.display = "";
        return true;
    };
    ChatNotificationIcon.prototype.hide = function () {
        if (this.element.style.display === "none") {
            return false;
        }
        this.element.style.display = "none";
        return true;
    };
    return ChatNotificationIcon;
})();
var ChatFormState = (function () {
    function ChatFormState(element) {
        this.state = -1;
        this.element = element;
        this.setState(ChatFormState.STATE_NORMAL);
    }
    ChatFormState.prototype.getState = function () {
        return this.state;
    };
    ChatFormState.prototype.isNormal = function () {
        return this.state === ChatFormState.STATE_NORMAL;
    };
    ChatFormState.prototype.isAction = function () {
        return this.state === ChatFormState.STATE_ACTION;
    };
    ChatFormState.prototype.isStory = function () {
        return this.state === ChatFormState.STATE_STORY;
    };
    ChatFormState.prototype.isOff = function () {
        return this.state === ChatFormState.STATE_OFF;
    };
    ChatFormState.prototype.setState = function (state) {
        if (this.state === state) {
            return;
        }
        var stateClass = ["icons-chatFormStateNormal", "icons-chatFormStateAction", "icons-chatFormStateStory", "icons-chatFormStateOff"];
        this.element.classList.remove(stateClass[this.state]);
        this.element.classList.add(stateClass[state]);
        this.state = state;
    };
    ChatFormState.STATE_NORMAL = 0;
    ChatFormState.STATE_ACTION = 1;
    ChatFormState.STATE_STORY = 2;
    ChatFormState.STATE_OFF = 3;
    return ChatFormState;
})();
var ChatAvatarChoice = (function () {
    function ChatAvatarChoice(name, avatar) {
        this.avatar = new ChatAvatar();
        this.box = document.createElement("div");
        this.useButton = document.createElement("a");
        this.deleteButton = document.createElement("a");
        var obj = {
            id: Application.Login.isLogged() ? Application.Login.getUser().id : undefined,
            persona: name,
            avatar: avatar
        };
        this.avatar.updateFromObject(obj);
        this.box.appendChild(this.avatar.getHTML());
        this.box.appendChild(this.useButton);
        this.box.appendChild(this.deleteButton);
        this.id = avatar + ";" + name;
        this.box.classList.add("chatAvatarChoiceBox");
        this.useButton.classList.add("chatAvatarChoiceBoxUse");
        this.deleteButton.classList.add("chatAvatarChoiceBoxDelete");
        this.useButton.addEventListener("click", {
            name: name,
            avatar: avatar,
            handleEvent: function () {
                UI.Chat.PersonaDesigner.usePersona(this.name, this.avatar);
            }
        });
        this.deleteButton.addEventListener("click", {
            choice: this,
            handleEvent: function () {
                UI.Chat.PersonaDesigner.removeChoice(this.choice);
            }
        });
        UI.Language.addLanguageTitle(this.useButton, "_CHATPERSONADESIGNERUSE_");
        UI.Language.addLanguageTitle(this.deleteButton, "_CHATPERSONADESIGNERDELETE_");
        this.nameStr = name;
        this.avatarStr = avatar;
    }
    ChatAvatarChoice.prototype.getHTML = function () {
        return this.box;
    };
    return ChatAvatarChoice;
})();
var ChatSystemMessage = (function () {
    function ChatSystemMessage(hasLanguage) {
        this.element = document.createElement("p");
        this.element.classList.add("chatMessageNotification");
        this.hasLanguage = hasLanguage;
    }
    ChatSystemMessage.prototype.addLangVar = function (id, value) {
        UI.Language.addLanguageVariable(this.element, id, value);
    };
    ChatSystemMessage.prototype.addTextLink = function (text, hasLanguage, click) {
        var a = document.createElement("a");
        a.classList.add("textLink");
        a.appendChild(document.createTextNode(text));
        if (hasLanguage) {
            UI.Language.markLanguage(a);
        }
        a.addEventListener("click", click);
        this.element.appendChild(a);
    };
    ChatSystemMessage.prototype.addText = function (text) {
        this.element.appendChild(document.createTextNode(text));
    };
    ChatSystemMessage.prototype.addElement = function (ele) {
        this.element.appendChild(ele);
    };
    ChatSystemMessage.prototype.getElement = function () {
        if (this.hasLanguage) {
            UI.Language.markLanguage(this.element);
        }
        return this.element;
    };
    return ChatSystemMessage;
})();
/**
 * Created by Reddo on 14/09/2015.
 */
/// <reference path='Interfaces/Listener.ts' />
/// <reference path='Interfaces/PageManagerPage.ts' />
/// <reference path='Interfaces/PersonaInfo.ts' />
/// <reference path='Interfaces/PersonaLocalInfo.ts' />
/// <reference path='Interfaces/ChatController.ts' />
/// <reference path='Classes/User.ts' />
/// <reference path='Classes/UserGameContext.ts' />
/// <reference path='Classes/UserRoomContext.ts' />
/// <reference path='Classes/Room.ts' />
/// <reference path='Classes/Game.ts' />
/// <reference path='Classes/SheetInstance.ts' />
/// <reference path='Classes/SimpleListener.ts' />
/// <reference path='Classes/AJAXConfig.ts' />
/// <reference path='Classes/WebsocketController.ts' />
/// <reference path='Classes/ChatWsController.ts' />
/// <reference path='Classes/Configuration.ts' />
/// <reference path='Classes/Configuration/NumberConfiguration.ts' />
/// <reference path='Classes/Configuration/WsportConfiguration.ts' />
/// <reference path='Classes/Configuration/LanguageConfiguration.ts' />
/// <reference path='Classes/Configuration/BooleanConfiguration.ts' />
/// <reference path='Classes/Memory.ts' />
/// <reference path='Classes/Memory/MemoryCombat.ts' />
/// <reference path='Classes/Memory/Combat/Buff.ts' />
/// <reference path='Elements/ChatInfo.ts' />
/// <reference path='Elements/ChatAvatar.ts' />
/// <reference path='Elements/ChatNotificationIcon.ts' />
/// <reference path='Elements/ChatFormState.ts' />
/// <reference path='Elements/ChatAvatarChoice.ts' />
/// <reference path='Elements/ChatSystemMessage.ts' /> 
var MessageFactory;
(function (MessageFactory) {
    MessageFactory.messageClasses = {};
    var messageSlash = {};
    function registerMessage(msg, id, slashCommands) {
        if (MessageFactory.messageClasses[id] !== undefined) {
            console.warn("Attempt to overwrite message type at " + id + ". Ignoring. Offending class:", msg);
            return;
        }
        MessageFactory.messageClasses[id] = msg;
        for (var i = 0; i < slashCommands.length; i++) {
            if (messageSlash[slashCommands[i]] !== undefined) {
                console.warn("Attempt to overwrite message slash command at " + slashCommands[i] + ". Ignoring. Offending class:", msg);
                continue;
            }
            messageSlash[slashCommands[i]] = msg;
        }
    }
    MessageFactory.registerMessage = registerMessage;
    function registerSlashCommand(slash, slashCommands) {
        for (var i = 0; i < slashCommands.length; i++) {
            if (messageSlash[slashCommands[i]] !== undefined) {
                console.warn("Attempt to overwrite message slash command at " + slashCommands[i] + ". Ignoring. Offending class:", slash);
                continue;
            }
            messageSlash[slashCommands[i]] = slash;
        }
    }
    MessageFactory.registerSlashCommand = registerSlashCommand;
    function createMessageFromType(id) {
        id = id.toLowerCase();
        if (MessageFactory.messageClasses[id] !== undefined) {
            return new MessageFactory.messageClasses[id]();
        }
        return new MessageUnknown();
    }
    MessageFactory.createMessageFromType = createMessageFromType;
    function createTestingMessages() {
        var list = [];
        for (var id in MessageFactory.messageClasses) {
            var message = new MessageFactory.messageClasses[id]();
            list = list.concat(message.makeMockUp());
        }
        return list;
    }
    MessageFactory.createTestingMessages = createTestingMessages;
    function getConstructorFromText(form) {
        var index = form.indexOf(' ');
        if (index !== -1) {
            var slash = form.substr(0, index).toLowerCase();
            var msg = form.substr(index + 1);
        }
        else {
            var slash = form;
            var msg = "";
        }
        if (messageSlash[slash] !== undefined) {
            return messageSlash[slash];
        }
        return null;
    }
    MessageFactory.getConstructorFromText = getConstructorFromText;
    function createFromText(form) {
        var index = form.indexOf(' ');
        if (index !== -1) {
            var slash = form.substr(0, index).toLowerCase();
            var msg = form.substr(index + 1);
        }
        else {
            var slash = form;
            var msg = "";
        }
        if (messageSlash[slash] !== undefined) {
            var command = new messageSlash[slash]();
            var valid = command.receiveCommand(slash, msg);
            if (valid && command.isMessage()) {
                return command;
            }
            else if (!valid) {
                var errorHTML = command.getInvalidHTML(slash, msg);
                if (errorHTML !== null)
                    UI.Chat.printElement(errorHTML);
                return null;
            }
        }
        var error = new ChatSystemMessage(true);
        error.addText("_CHATINVALIDCOMMAND_");
        UI.Chat.printElement(error.getElement());
        return null;
    }
    MessageFactory.createFromText = createFromText;
})(MessageFactory || (MessageFactory = {}));
var SlashCommand = (function () {
    function SlashCommand() {
    }
    SlashCommand.prototype.receiveCommand = function (slashCommand, message) {
        console.error("SlashCommand.receiveCommand is abstract. Offending class:", this.constructor['name'], this);
        return false;
    };
    SlashCommand.prototype.isMessage = function () {
        return this instanceof Message;
    };
    SlashCommand.prototype.getInvalidHTML = function (slashCommand, msg) {
        return null;
    };
    return SlashCommand;
})();
var SlashClear = (function (_super) {
    __extends(SlashClear, _super);
    function SlashClear() {
        _super.apply(this, arguments);
    }
    return SlashClear;
})(SlashCommand);
MessageFactory.registerSlashCommand(SlashClear, ["/clear", "/clr", "/cls"]);
var SlashReply = (function (_super) {
    __extends(SlashReply, _super);
    function SlashReply() {
        _super.apply(this, arguments);
    }
    return SlashReply;
})(SlashCommand);
MessageFactory.registerSlashCommand(SlashReply, ["/r", "/reply", "/responder", "/resposta"]);
var Message = (function (_super) {
    __extends(Message, _super);
    function Message() {
        _super.apply(this, arguments);
        this.id = 0;
        this.localid = null;
        this.roomid = null;
        this.date = null;
        this.module = "";
        this.msg = "";
        this.special = {};
        this.sending = null;
        this.origin = 0;
        this.destination = null;
        this.updatedListeners = [];
        this.html = null;
        this.clone = false;
    }
    Message.prototype.onPrint = function () { };
    ;
    Message.prototype.setPersona = function (name) {
        this.setSpecial("persona", name);
    };
    Message.prototype.getPersona = function () {
        return this.getSpecial("persona", "???");
    };
    Message.prototype.findPersona = function () { };
    Message.prototype.getLocalId = function () {
        if (this.localid === null)
            DB.MessageDB.registerLocally(this);
    };
    Message.prototype.getUser = function () {
        var user = DB.UserDB.getAUser(this.origin);
        var context = user.getRoomContext(this.roomid);
        if (context === null) {
            context = new UserRoomContext(user);
            context.roomid = this.roomid;
            if (this.origin !== 0) {
                console.warn("[MESSAGE] Could not find user Room Context for " + this.origin + ", creating a new one.");
            }
        }
        return context;
    };
    Message.prototype.addDestinationStorytellers = function (room) {
        if (room === null) {
            return;
        }
        var storytellers = room.getStorytellers();
        for (var i = 0; i < storytellers.length; i++) {
            this.addDestination(storytellers[i].getUser());
        }
    };
    Message.prototype.addDestination = function (user) {
        if (this.destination === null) {
            this.destination = [user.id];
        }
        else if (typeof this.destination === "number") {
            this.destination = [this.destination, user.id];
        }
        else if (Array.isArray(this.destination)) {
            this.destination.push(user.id);
        }
        else {
            console.warn("[MESSAGE] Attempt to add user to unknown destination type? What gives? Offending user and message:", user, this);
        }
    };
    Message.prototype.getDestinations = function () {
        if (Array.isArray(this.destination)) {
            var users = [];
            for (var i = 0; i < this.destination.length; i++) {
                var user = DB.UserDB.getAUser(this.destination[i]);
                var context = user.getRoomContext(this.roomid);
                if (context === null) {
                    context = new UserRoomContext(user);
                    context.roomid = this.roomid;
                    console.warn("[MESSAGE] Could not find user Room Context for " + this.destination[i] + ", creating a new one.");
                }
                users.push(context);
            }
            return users;
        }
        else {
            var user = DB.UserDB.getAUser(this.destination);
            var context = user.getRoomContext(this.roomid);
            if (context === null) {
                context = new UserRoomContext(user);
                context.roomid = this.roomid;
                console.warn("[MESSAGE] Could not find user Room Context for " + this.destination + ", creating a new one.");
            }
            return [context];
        }
    };
    Message.prototype.makeMockUp = function () {
        this.msg = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent volutpat orci nulla, et dictum turpis commodo a. Duis iaculis neque lectus, ac sodales diam varius id.";
        return [this];
    };
    Message.prototype.isWhisper = function () {
        if (Array.isArray(this.destination)) {
            return this.destination.length > 0;
        }
        return this.destination !== null && this.destination !== 0;
    };
    Message.prototype.isMine = function () {
        return this.origin === Application.getMyId();
    };
    Message.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.appendChild(document.createTextNode("_CHATMESSAGEUNKNOWNTYPE_"));
        p.dataset['a'] = this.msg;
        return p;
    };
    Message.prototype.getHTML = function () {
        if (this.html === null) {
            this.html = this.createHTML();
        }
        return this.html;
    };
    Message.prototype.prepareSending = function () {
        this.origin = Application.getMyId();
        this.getLocalId();
        var html = this.getHTML();
        if (html !== null && this.html === html) {
            this.html.classList.add("chatMessageSending");
            var timeoutFunction = (function (message) {
                var html = message.getHTML();
                html.classList.remove("chatMessageSending");
                html.classList.add("chatMessageError");
                var errorMessage = new ChatSystemMessage(true);
                errorMessage.addText("_CHATMESSAGENOTSENT_");
                errorMessage.addText(" ");
                var click = {
                    message: message,
                    error: errorMessage,
                    handleEvent: function () {
                        var error = this.error.getElement();
                        if (error.parentNode !== null) {
                            error.parentNode.removeChild(error);
                        }
                        var html = this.message.getHTML();
                        html.classList.remove("chatMessageError");
                        UI.Chat.sendMessage(this.message);
                    }
                };
                errorMessage.addTextLink("_CHATMESSAGENOTSENTRESEND_", true, click);
                if (html.parentNode !== null) {
                    html.parentNode.insertBefore(errorMessage.getElement(), html.nextSibling);
                    UI.Chat.updateScrollPosition(true);
                }
            }).bind(null, this);
            this.sending = setTimeout(timeoutFunction, 8000);
        }
    };
    Message.prototype.getSpecial = function (id, defaultValue) {
        if (this.special[id] !== undefined) {
            return this.special[id];
        }
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        return null;
    };
    Message.prototype.setSpecial = function (id, value) {
        this.special[id] = value;
    };
    Message.prototype.updateFromObject = function (obj) {
        for (var id in this) {
            if (obj[id] === undefined)
                continue;
            if (id === "localid")
                continue;
            this[id] = obj[id];
        }
        if (typeof this.special === "string") {
            this.special = JSON.parse(this.special);
        }
        this.triggerUpdated();
    };
    Message.prototype.exportAsObject = function () {
        var result = {};
        var attributes = [
            'destination', 'module', 'origin', 'roomid', 'date', "clone", 'localid', 'special'
        ];
        for (var i = 0; i < attributes.length; i++) {
            if (this[attributes[i]] !== undefined) {
                result[attributes[i]] = this[attributes[i]];
            }
        }
        result["message"] = this.msg;
        return result;
    };
    Message.prototype.receiveCommand = function (slashCommand, msg) {
        this.msg = msg;
        return true;
    };
    Message.prototype.setMsg = function (str) {
        this.msg = str;
    };
    Message.prototype.getMsg = function () {
        if (this.msg === null) {
            return "";
        }
        return this.msg;
    };
    Message.prototype.unsetSpecial = function (id) {
        delete (this.special[id]);
    };
    Message.prototype.addUpdatedListener = function (list) {
        this.updatedListeners.push(list);
    };
    Message.prototype.triggerUpdated = function () {
        for (var i = 0; i < this.updatedListeners.length; i++) {
            this.updatedListeners[i].handleEvent(this);
        }
        if (this.sending !== null) {
            clearTimeout(this.sending);
            this.html.classList.remove("chatMessageSending");
            this.sending = null;
        }
        if (this.localid !== null) {
            DB.MessageDB.releaseLocalMessage(this.localid);
        }
    };
    Message.prototype.doNotPrint = function () {
        if (this.clone && this.destination !== null) {
            return true;
        }
        return false;
    };
    return Message;
})(SlashCommand);
var MessageSystem = (function (_super) {
    __extends(MessageSystem, _super);
    function MessageSystem() {
        _super.apply(this, arguments);
        this.module = "system";
    }
    MessageSystem.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatMessageSystem");
        var b = document.createElement("b");
        b.appendChild(document.createTextNode("_CHATMESSAGEANNOUNCEMENT_"));
        UI.Language.markLanguage(b);
        p.appendChild(b);
        p.appendChild(document.createTextNode(": " + this.getMsg()));
        return p;
    };
    return MessageSystem;
})(Message);
MessageFactory.registerMessage(MessageSystem, "system", []);
var MessageCountdown = (function (_super) {
    __extends(MessageCountdown, _super);
    function MessageCountdown() {
        _super.call(this);
        this.counter = document.createTextNode("99999");
        this.module = "countdown";
        this.addUpdatedListener(new SimpleListener(function (e) {
            var target = e.getTarget();
            if (target !== null) {
                var msg = DB.MessageDB.getMessage(target);
                if (msg !== null) {
                    msg.updateCounter(e.getCounter());
                }
            }
            else {
                e.updateCounter(parseInt(e.getMsg()));
            }
        }));
    }
    MessageCountdown.prototype.createHTML = function () {
        if (this.getMsg() === "") {
            return null;
        }
        var p = document.createElement("p");
        var counter = parseInt(this.getMsg());
        this.updateCounter(counter);
        var span = document.createElement("span");
        if (counter > 0) {
            span.classList.add("chatMessageCounterSpan");
            span.appendChild(this.counter);
            p.classList.add("chatMessageCounter");
        }
        else {
            span.classList.add("chatMessageCounterEndSpan");
            p.classList.add("chatMessageCounterEnd");
        }
        p.appendChild(span);
        return p;
    };
    MessageCountdown.prototype.receiveCommand = function (slash, msg) {
        if (MessageCountdown.timeout !== null) {
            clearTimeout(MessageCountdown.timeout);
            MessageCountdown.timeout = null;
            var message = new MessageCountdown();
            message.setTarget(MessageCountdown.lastTimeout.id);
            message.setMsg("0");
            message.setCounter(0);
            UI.Chat.sendMessage(message);
            MessageCountdown.lastTimeout = null;
        }
        var counter = parseInt(msg);
        if (isNaN(counter)) {
            return false;
        }
        this.setMsg(counter.toString());
        var func = function () {
            if (this.target.id === 0) {
                MessageCountdown.timeout = setTimeout(this['func'], 1000);
                return;
            }
            var msg;
            if (this.current > 0) {
                msg = new MessageCountdown();
                msg.setTarget(this.target.id);
                msg.setCounter(this.current--);
                MessageCountdown.timeout = setTimeout(this['func'], 1000);
            }
            else if (this.current <= 0) {
                msg = new MessageCountdown();
                msg.setTarget(this.target.id);
                msg.setCounter(this.current);
                msg.setMsg(this.current.toString());
                MessageCountdown.timeout = null;
                MessageCountdown.lastTimeout = null;
            }
            UI.Chat.sendMessage(msg);
        };
        var counterObj = {
            current: counter - 1,
            target: this
        };
        counterObj['func'] = func.bind(counterObj);
        MessageCountdown.lastTimeout = this;
        MessageCountdown.timeout = setTimeout(counterObj['func'], 1000);
        return true;
    };
    MessageCountdown.prototype.getTarget = function () {
        return this.getSpecial("target", null);
    };
    MessageCountdown.prototype.setTarget = function (id) {
        this.setSpecial("target", id);
    };
    MessageCountdown.prototype.setCounter = function (e) {
        this.setSpecial("counter", e);
    };
    MessageCountdown.prototype.getCounter = function () {
        return this.getSpecial("counter", 0);
    };
    MessageCountdown.prototype.updateCounter = function (e) {
        var curr = parseInt(this.counter.nodeValue);
        if (e < curr) {
            this.counter.nodeValue = e.toString();
        }
    };
    MessageCountdown.timeout = null;
    return MessageCountdown;
})(Message);
MessageFactory.registerMessage(MessageCountdown, "countdown", ["/countdown", "/count"]);
var MessageVote = (function (_super) {
    __extends(MessageVote, _super);
    function MessageVote() {
        _super.call(this);
        this.module = "vote";
        this.voters = [];
        this.voteAmountText = document.createTextNode("0");
        this.votersText = document.createTextNode("");
        this.addUpdatedListener({
            handleEvent: function (e) {
                if (e.getVoteTarget() !== null) {
                    var target = DB.MessageDB.getMessage(e.getVoteTarget());
                    if (target !== null && target instanceof MessageVote) {
                        target.addVote(e.getUser());
                    }
                }
            }
        });
    }
    MessageVote.prototype.setVoteTarget = function (id) {
        this.setSpecial("castvote", id);
    };
    MessageVote.prototype.getVoteTarget = function () {
        return this.getSpecial("castvote", null);
    };
    MessageVote.prototype.createHTML = function () {
        if (this.getVoteTarget() !== null) {
            return null;
        }
        var p = document.createElement("p");
        p.classList.add("chatMessageVote");
        var a = document.createElement("a");
        a.classList.add("chatMessageVoteAmount");
        a.appendChild(this.voteAmountText);
        p.appendChild(a);
        var reason = document.createElement("span");
        reason.classList.add("chatMessageVoteReason");
        reason.appendChild(document.createTextNode(this.getUser().getUniqueNickname() + " "));
        reason.appendChild(document.createTextNode("_CHATMESSAGEVOTECREATEDVOTE_"));
        reason.appendChild(document.createTextNode(": " + this.getMsg()));
        UI.Language.markLanguage(reason);
        p.appendChild(reason);
        var span = document.createElement("span");
        span.classList.add("chatMessageVoteVoters");
        span.appendChild(this.votersText);
        p.appendChild(span);
        var clickObj = {
            message: this,
            handleEvent: function () {
                var vote = new MessageVote();
                vote.setVoteTarget(this.message.id);
                UI.Chat.sendMessage(vote);
            }
        };
        a.addEventListener("click", clickObj);
        return p;
    };
    MessageVote.prototype.updateVoters = function () {
        this.voteAmountText.nodeValue = this.voters.length.toString();
        var voterNames = [];
        for (var i = 0; i < this.voters.length; i++) {
            voterNames.push(this.voters[i].getUniqueNickname());
        }
        if (this.voters.length > 0) {
            this.votersText.nodeValue = voterNames.join(", ") + ".";
        }
        else {
            this.votersText.nodeValue = "";
        }
    };
    MessageVote.prototype.addVote = function (user) {
        if (this.voters.indexOf(user) === -1) {
            this.voters.push(user);
            this.updateVoters();
        }
        else {
            this.removeVote(user);
        }
    };
    MessageVote.prototype.removeVote = function (user) {
        var index = this.voters.indexOf(user);
        if (index !== -1) {
            this.voters.splice(index, 1);
            this.updateVoters();
        }
    };
    return MessageVote;
})(Message);
MessageFactory.registerMessage(MessageVote, "vote", ["/vote", "/voto", "/votar", "/vota"]);
var MessageWebm = (function (_super) {
    __extends(MessageWebm, _super);
    function MessageWebm() {
        _super.apply(this, arguments);
        this.module = "webm";
    }
    MessageWebm.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatMessageShare");
        p.appendChild(document.createTextNode(this.getUser().getUniqueNickname() + " "));
        p.appendChild(document.createTextNode("_CHATMESSAGESHAREDVIDEO_"));
        var name = this.getName();
        if (name !== null) {
            p.appendChild(document.createTextNode(": " + name + ". "));
        }
        else {
            p.appendChild(document.createTextNode(". "));
        }
        UI.Language.markLanguage(p);
        var a = document.createElement("a");
        a.classList.add("textLink");
        a.appendChild(document.createTextNode("_CHATMESSAGEPLAYVIDEO_"));
        a.appendChild(document.createTextNode("."));
        UI.Language.markLanguage(a);
        p.appendChild(a);
        return p;
    };
    MessageWebm.prototype.getName = function () {
        return this.getSpecial("name", null);
    };
    MessageWebm.prototype.setName = function (name) {
        this.setSpecial("name", name);
    };
    return MessageWebm;
})(Message);
MessageFactory.registerMessage(MessageWebm, "webm", ["/webm"]);
var MessageVideo = (function (_super) {
    __extends(MessageVideo, _super);
    function MessageVideo() {
        _super.apply(this, arguments);
        this.module = "youtube";
    }
    MessageVideo.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatMessageShare");
        p.appendChild(document.createTextNode(this.getUser().getUniqueNickname() + " "));
        p.appendChild(document.createTextNode("_CHATMESSAGESHAREDVIDEO_"));
        var name = this.getName();
        if (name !== null) {
            p.appendChild(document.createTextNode(": " + name + ". "));
        }
        else {
            p.appendChild(document.createTextNode(". "));
        }
        UI.Language.markLanguage(p);
        var a = document.createElement("a");
        a.classList.add("textLink");
        a.appendChild(document.createTextNode("_CHATMESSAGEPLAYVIDEO_"));
        a.appendChild(document.createTextNode("."));
        UI.Language.markLanguage(a);
        p.appendChild(a);
        return p;
    };
    MessageVideo.prototype.getName = function () {
        return this.getSpecial("name", null);
    };
    MessageVideo.prototype.setName = function (name) {
        this.setSpecial("name", name);
    };
    return MessageVideo;
})(Message);
MessageFactory.registerMessage(MessageVideo, "youtube", ["/video", "/youtube"]);
var MessageSE = (function (_super) {
    __extends(MessageSE, _super);
    function MessageSE() {
        _super.apply(this, arguments);
        this.module = "seplay";
        this.playedBefore = false;
    }
    MessageSE.prototype.onPrint = function () {
        if (this.playedBefore) {
            return;
        }
        if (UI.Chat.doAutomation()) {
            var cfg = Application.Config.getConfig("autoSE").getValue();
            if (cfg === 0 || this.getUser().isStoryteller() || cfg === 2) {
                UI.SoundController.playSE(this.getMsg());
                this.playedBefore = true;
            }
        }
    };
    MessageSE.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatMessageShare");
        p.appendChild(document.createTextNode(this.getUser().getUniqueNickname() + " "));
        p.appendChild(document.createTextNode("_CHATMESSAGESHAREDSE_"));
        var name = this.getName();
        if (name !== null) {
            p.appendChild(document.createTextNode(": " + name + ". "));
        }
        else {
            p.appendChild(document.createTextNode(". "));
        }
        UI.Language.markLanguage(p);
        var a = document.createElement("a");
        a.classList.add("textLink");
        a.appendChild(document.createTextNode("_CHATMESSAGEPLAYSE_"));
        a.appendChild(document.createTextNode("."));
        a.addEventListener("click", {
            message: this,
            handleEvent: function (e) {
                UI.SoundController.playSE(this.message.getMsg());
            }
        });
        UI.Language.markLanguage(a);
        p.appendChild(a);
        return p;
    };
    MessageSE.prototype.getName = function () {
        return this.getSpecial("name", null);
    };
    MessageSE.prototype.setName = function (name) {
        this.setSpecial("name", name);
    };
    return MessageSE;
})(Message);
MessageFactory.registerMessage(MessageSE, "seplay", ["/se", "/seplay", "/soundeffect", "/sound"]);
var MessageImage = (function (_super) {
    __extends(MessageImage, _super);
    function MessageImage() {
        _super.apply(this, arguments);
        this.module = "image";
    }
    MessageImage.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatMessageShare");
        p.appendChild(document.createTextNode(this.getUser().getUniqueNickname() + " "));
        p.appendChild(document.createTextNode("_CHATMESSAGESHAREDIMAGE_"));
        var name = this.getName();
        if (name !== null) {
            p.appendChild(document.createTextNode(": " + name + ". "));
        }
        else {
            p.appendChild(document.createTextNode(". "));
        }
        UI.Language.markLanguage(p);
        var a = document.createElement("a");
        a.classList.add("textLink");
        a.appendChild(document.createTextNode("_CHATMESSAGESEEIMAGE_"));
        a.appendChild(document.createTextNode("."));
        UI.Language.markLanguage(a);
        p.appendChild(a);
        return p;
    };
    MessageImage.prototype.getName = function () {
        return this.getSpecial("name", null);
    };
    MessageImage.prototype.setName = function (name) {
        this.setSpecial("name", name);
    };
    return MessageImage;
})(Message);
MessageFactory.registerMessage(MessageImage, "image", ["/image", "/imagem", "/picture", "/figura", "/pic"]);
var MessageBGM = (function (_super) {
    __extends(MessageBGM, _super);
    function MessageBGM() {
        _super.apply(this, arguments);
        this.module = "bgmplay";
        this.playedBefore = false;
    }
    MessageBGM.prototype.onPrint = function () {
        if (this.playedBefore) {
            return;
        }
        if (UI.Chat.doAutomation()) {
            var cfg = Application.Config.getConfig("autoBGM").getValue();
            if (cfg === 0 || this.getUser().isStoryteller() || cfg === 2) {
                UI.SoundController.playBGM(this.getMsg());
                this.playedBefore = true;
            }
        }
    };
    MessageBGM.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatMessageShare");
        p.appendChild(document.createTextNode(this.getUser().getUniqueNickname() + " "));
        p.appendChild(document.createTextNode("_CHATMESSAGESHAREDBGM_"));
        var name = this.getName();
        if (name !== null) {
            p.appendChild(document.createTextNode(": " + name + ". "));
        }
        else {
            p.appendChild(document.createTextNode(". "));
        }
        UI.Language.markLanguage(p);
        var a = document.createElement("a");
        a.classList.add("textLink");
        a.appendChild(document.createTextNode("_CHATMESSAGEPLAYBGM_"));
        a.appendChild(document.createTextNode("."));
        a.addEventListener("click", {
            message: this,
            handleEvent: function (e) {
                UI.SoundController.playBGM(this.message.getMsg());
            }
        });
        UI.Language.markLanguage(a);
        p.appendChild(a);
        return p;
    };
    MessageBGM.prototype.getName = function () {
        return this.getSpecial("name", null);
    };
    MessageBGM.prototype.setName = function (name) {
        this.setSpecial("name", name);
    };
    return MessageBGM;
})(Message);
MessageFactory.registerMessage(MessageBGM, "bgmplay", ["/bgm", "/splay", "/bgmplay", "/musica"]);
var MessageStream = (function (_super) {
    __extends(MessageStream, _super);
    function MessageStream() {
        _super.apply(this, arguments);
        this.module = "stream";
    }
    MessageStream.prototype.createHTML = function () {
        return null;
    };
    return MessageStream;
})(Message);
MessageFactory.registerMessage(MessageStream, "stream", []);
var MessageSheetcommand = (function (_super) {
    __extends(MessageSheetcommand, _super);
    function MessageSheetcommand() {
        _super.apply(this, arguments);
        this.module = "sheetcmd";
    }
    MessageSheetcommand.prototype.createHTML = function () {
        return null;
    };
    return MessageSheetcommand;
})(Message);
MessageFactory.registerMessage(MessageSheetcommand, "sheetcmd", []);
var MessageWhisper = (function (_super) {
    __extends(MessageWhisper, _super);
    function MessageWhisper() {
        _super.call(this);
        this.module = "whisper";
        var list = new SimpleListener(function (message) {
            if (!message.isMine()) {
                UI.Chat.Forms.setLastWhisperFrom(message.getUser());
            }
        });
        this.addUpdatedListener(list);
    }
    MessageWhisper.prototype.onPrint = function () {
        if (!this.isMine() && UI.Chat.doAutomation() && !document.hasFocus()) {
            UI.SoundController.playAlert();
        }
    };
    MessageWhisper.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatWhisper");
        var b = document.createElement("b");
        b.classList.add("chatWhisperLink");
        b.appendChild(document.createTextNode("( "));
        b.addEventListener("click", {
            destination: this.destination,
            msg: this,
            handleEvent: function () {
                if (!this.msg.isMine()) {
                    UI.Chat.Forms.setInput("/whisper " + this.msg.getUser().getUniqueNickname() + ", ");
                }
                else {
                    var destination = Array.isArray(this.destination) ? this.destination[0] : this.destination;
                    UI.Chat.Forms.setInput("/whisper " + DB.UserDB.getAUser(destination).getRoomContext(UI.Chat.getRoom().id).getUniqueNickname() + ", ");
                }
            }
        });
        if (Application.isMe(this.origin)) {
            b.appendChild(document.createTextNode("_CHATMESSAGEWHISPERTO_"));
            var destination = Array.isArray(this.destination) ? this.destination[0] : this.destination;
            b.appendChild(document.createTextNode(" " + DB.UserDB.getAUser(destination).getFullNickname() + " )"));
        }
        else {
            b.appendChild(document.createTextNode("_CHATMESSAGEWHISPERFROM_"));
            b.appendChild(document.createTextNode(" " + this.getUser().getUser().getFullNickname() + " )"));
        }
        p.appendChild(b);
        p.appendChild(document.createTextNode(": " + this.getMsg()));
        UI.Language.markLanguage(b);
        return p;
    };
    MessageWhisper.prototype.receiveCommand = function (slashCommand, msg) {
        var room = UI.Chat.getRoom();
        var index = msg.indexOf(',');
        var target = msg.substr(0, index).trim();
        var message = msg.substr(index + 1).trim();
        var users = room.getUsersByName(target);
        if (users.length === 1) {
            this.setMsg(message);
            this.addDestination(users[0].getUser());
            return true;
        }
        else {
            return false;
        }
    };
    MessageWhisper.prototype.getInvalidHTML = function (slashCommand, msg) {
        var room = UI.Chat.getRoom();
        var index = msg.indexOf(',');
        var target = msg.substr(0, index).trim();
        var message = msg.substr(index + 1).trim();
        var users = room.getUsersByName(target);
        var error = new ChatSystemMessage(true);
        if (users.length === 0) {
            error.addText("_CHATWHISPERNOTARGETSFOUND_");
            error.addLangVar("a", target);
        }
        else {
            var clickF = function () {
                UI.Chat.Forms.setInput("/whisper " + this.target + ", " + this.message);
            };
            error.addText("_CHATMULTIPLETARGETSFOUND_");
            error.addText(": ");
            for (var i = 0; i < users.length; i++) {
                var listener = new SimpleListener(clickF);
                listener.setValue("target", users[i].getUniqueNickname());
                listener.setValue("message", message);
                error.addTextLink(users[i].getUniqueNickname(), false, listener);
                if ((i + 1) < users.length) {
                    error.addText(", ");
                }
                else {
                    error.addText(".");
                }
            }
        }
        return error.getElement();
    };
    return MessageWhisper;
})(Message);
MessageFactory.registerMessage(MessageWhisper, "whisper", ["/whisper", "/whisp", "/private", "/pm", "/privado", "/pessoal", "/w"]);
var MessageSheetdamage = (function (_super) {
    __extends(MessageSheetdamage, _super);
    function MessageSheetdamage() {
        _super.apply(this, arguments);
        this.module = "sheetdm";
    }
    MessageSheetdamage.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatMessageSheetdamage");
        p.classList.add(this.getType());
        var a = document.createElement("a");
        a.classList.add("icons-chatDamage" + this.getType());
        a.classList.add("chatMessageDamageIcon");
        p.appendChild(a);
        p.appendChild(document.createTextNode(this.getSheetName() + ":"));
        var span = document.createElement("span");
        span.classList.add("chatMessageDamageBubble");
        span.classList.add(this.getType());
        span.appendChild(document.createTextNode(this.getAmount() + " " + this.getType()));
        p.appendChild(span);
        return p;
    };
    MessageSheetdamage.prototype.getType = function () {
        var type = this.getSpecial("type", "HP");
        if (type === "HP" || type === "MP" || type === "Exp") {
            return type;
        }
        return "HP";
    };
    MessageSheetdamage.prototype.setTypeHP = function () {
        this.setSpecial("type", "HP");
    };
    MessageSheetdamage.prototype.setTypeMP = function () {
        this.setSpecial("type", "MP");
    };
    MessageSheetdamage.prototype.setTypeExp = function () {
        this.setSpecial("type", "Exp");
    };
    MessageSheetdamage.prototype.setLog = function (log) {
        this.setSpecial("log", log);
    };
    MessageSheetdamage.prototype.getLog = function () {
        return this.getSpecial("log", null);
    };
    MessageSheetdamage.prototype.setSheetName = function (name) {
        this.msg = name;
    };
    MessageSheetdamage.prototype.getSheetName = function () {
        var old = this.getSpecial("sheetname", null);
        if (old === null) {
            old = this.msg;
        }
        return old;
    };
    MessageSheetdamage.prototype.setAmount = function (amount) {
        this.setSpecial("amount", amount);
    };
    MessageSheetdamage.prototype.getAmount = function () {
        var amount = this.getSpecial("amount", null);
        if (amount === null) {
            return "0?";
        }
        if (typeof amount === "string") {
            amount = parseInt(amount);
        }
        if (amount > 0) {
            return "+ " + amount.toString();
        }
        return "- " + (amount * -1).toString();
    };
    return MessageSheetdamage;
})(Message);
MessageFactory.registerMessage(MessageSheetdamage, "sheetdm", []);
var MessageSheetturn = (function (_super) {
    __extends(MessageSheetturn, _super);
    function MessageSheetturn() {
        _super.apply(this, arguments);
        this.module = "sheettr";
    }
    MessageSheetturn.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatMessageTurn");
        var a = document.createElement("a");
        a.classList.add("icons-chatMessageTurn");
        a.classList.add("chatMessageTurnIcon");
        p.appendChild(a);
        p.appendChild(document.createTextNode(this.getSheetName() + ":"));
        return p;
    };
    MessageSheetturn.prototype.setSheetName = function (name) {
        this.msg = name;
    };
    MessageSheetturn.prototype.getSheetName = function () {
        var old = this.getSpecial("sheetname", null);
        if (old === null) {
            old = this.msg;
        }
        return old;
    };
    MessageSheetturn.prototype.setPlayer = function (id) {
        this.setSpecial("player", id);
    };
    MessageSheetturn.prototype.getPlayer = function () {
        return this.getSpecial('player', 0);
    };
    return MessageSheetturn;
})(Message);
MessageFactory.registerMessage(MessageSheetturn, "sheettr", []);
var MessageDice = (function (_super) {
    __extends(MessageDice, _super);
    function MessageDice() {
        _super.call(this);
        this.module = "dice";
        this.addUpdatedListener({
            handleEvent: function (e) {
                if (e.html !== null) {
                    var newHTML = e.createHTML();
                    if (e.html.parentNode !== null) {
                        e.html.parentNode.replaceChild(newHTML, e.html);
                    }
                    e.html = newHTML;
                }
            }
        });
    }
    MessageDice.prototype.findPersona = function () {
        var personaName = UI.Chat.PersonaManager.getPersonaName();
        this.setPersona(personaName === null ? "???" : personaName);
    };
    MessageDice.prototype.makeMockUp = function () {
        var messages = [this];
        this.addDice(2, 10);
        this.setSpecial("rolls", [5, 5]);
        this.msg = "Example Reason";
        messages.push(new MessageDice());
        messages.push(new MessageDice());
        messages[1].addDice(2, 10);
        messages[1].setSpecial("rolls", [1, 1]);
        messages[2].addDice(2, 10);
        messages[2].setSpecial("rolls", [10, 10]);
        return messages;
    };
    MessageDice.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatMessageDice");
        if (this.getRolls().length === 0 && this.getDice().length !== 0) {
            p.appendChild(document.createTextNode("_CHATDICEROLLEDWAITING_"));
            UI.Language.markLanguage(p);
            return p;
        }
        var b = document.createElement("b");
        b.appendChild(document.createTextNode("* " + this.getSpecial("persona", "????") + " "));
        p.appendChild(b);
        if (this.isWhisper()) {
            if (this.getRolls().length > 0) {
                p.appendChild(document.createTextNode("_CHATDICESECRETROLLED_"));
            }
            else {
                p.appendChild(document.createTextNode("_CHATDICESECRETSHOWN_"));
            }
        }
        else {
            if (this.getRolls().length > 0) {
                p.appendChild(document.createTextNode("_CHATDICEROLLED_"));
            }
            else {
                p.appendChild(document.createTextNode("_CHATDICESHOWN_"));
            }
        }
        p.appendChild(document.createTextNode(" "));
        if (this.getRolls().length > 0) {
            var initialRoll = document.createElement("span");
            initialRoll.classList.add("chatMessageDiceBoxSquare");
            initialRoll.appendChild(document.createTextNode(this.getInitialRoll()));
            p.appendChild(initialRoll);
            p.appendChild(document.createTextNode(" = "));
            var rolls = this.getRolls();
            var faces = this.getDice();
            var allCrits = true;
            var allFailures = true;
            for (var i = 0; i < rolls.length; i++) {
                var span = document.createElement("span");
                span.classList.add("chatMessageDiceBoxRoll");
                if (rolls[i] === faces[i] && faces[i] > 1) {
                    span.classList.add("rainbow");
                    allFailures = false;
                }
                else if (rolls[i] === 1 && faces[i] > 1) {
                    span.classList.add("shame");
                    allCrits = false;
                }
                else {
                    allCrits = false;
                    allFailures = false;
                }
                span.appendChild(document.createTextNode(rolls[i].toString()));
                p.appendChild(span);
                if ((i + 1) < rolls.length) {
                    p.appendChild(document.createTextNode(" + "));
                }
            }
            if (allCrits) {
                initialRoll.classList.add("rainbow");
            }
            else if (allFailures) {
                initialRoll.classList.add("shame");
            }
            if (this.getMod() !== 0) {
                p.appendChild(document.createTextNode(" + "));
                var span = document.createElement("span");
                span.classList.add("chatMessageDiceBoxCircle");
                span.appendChild(document.createTextNode(this.getMod().toString()));
                p.appendChild(span);
                if (allCrits) {
                    span.classList.add("rainbow");
                }
                else if (allFailures) {
                    span.classList.add("shame");
                }
            }
            p.appendChild(document.createTextNode(" = "));
            var span = document.createElement("span");
            span.classList.add("chatMessageDiceBoxResult");
            span.appendChild(document.createTextNode(this.getResult().toString()));
            if (allCrits) {
                span.classList.add("rainbow");
                p.classList.add("rainbow");
            }
            else if (allFailures) {
                span.classList.add("shame");
                p.classList.add("shame");
            }
            p.appendChild(span);
        }
        else {
            var initialRoll = document.createElement("span");
            initialRoll.classList.add("chatMessageDiceBoxCircle");
            initialRoll.appendChild(document.createTextNode(this.getMod().toString()));
            p.appendChild(initialRoll);
        }
        if (this.getMsg() !== "") {
            var span = document.createElement("span");
            span.classList.add("chatMessageDiceReason");
            var b = document.createElement("b");
            b.appendChild(document.createTextNode("_CHATMESSAGEDICEREASON_"));
            b.appendChild(document.createTextNode(": "));
            UI.Language.markLanguage(b);
            span.appendChild(b);
            span.appendChild(document.createTextNode(this.getMsg()));
            p.appendChild(span);
        }
        UI.Language.markLanguage(p);
        return p;
    };
    MessageDice.prototype.getInitialRoll = function () {
        var dices = this.getDice();
        var cleanedDices = {};
        var mod = this.getMod();
        for (var i = 0; i < dices.length; i++) {
            if (cleanedDices[dices[i]] === undefined) {
                cleanedDices[dices[i]] = 1;
            }
            else {
                cleanedDices[dices[i]]++;
            }
        }
        var finalString = [];
        for (var faces in cleanedDices) {
            finalString.push(cleanedDices[faces] + "d" + faces);
        }
        var str = finalString.join(" + ");
        if (mod < 0) {
            str += " - " + (mod * -1);
        }
        else {
            str += " + " + mod;
        }
        return str;
    };
    MessageDice.prototype.getRolls = function () {
        return this.getSpecial("rolls", []);
    };
    MessageDice.prototype.getMod = function () {
        return this.getSpecial("mod", 0);
    };
    MessageDice.prototype.setMod = function (mod) {
        this.setSpecial("mod", mod);
    };
    MessageDice.prototype.getDice = function () {
        return this.getSpecial("dice", []);
    };
    MessageDice.prototype.setDice = function (dice) {
        this.setSpecial("dice", dice);
    };
    MessageDice.prototype.addMod = function (mod) {
        this.setSpecial("mod", mod);
    };
    MessageDice.prototype.addDice = function (amount, faces) {
        if (faces === 0) {
            return;
        }
        var dices = this.getDice();
        for (var i = 0; i < amount; i++) {
            dices.push(faces);
        }
        this.setDice(dices);
    };
    MessageDice.prototype.getResult = function () {
        var result = 0;
        result += this.getMod();
        result += this.getRolls().reduce(function (previousValue, currentValue) {
            return previousValue + currentValue;
        });
        return result;
    };
    return MessageDice;
})(Message);
MessageFactory.registerMessage(MessageDice, "dice", []);
var MessageStory = (function (_super) {
    __extends(MessageStory, _super);
    function MessageStory() {
        _super.apply(this, arguments);
        this.module = "story";
    }
    MessageStory.prototype.makeMockUp = function () {
        var list = [];
        list.push(this);
        this.msg = "Lorem [ipsum] dolor {sit amet}, *consectetur adipiscing elit*. (Maecenas pellentesque) lectus neque, ac suscipit metus facilisis vitae. Sed ut nisi non massa sagittis molestie non sed libero.";
        this.setSpecial("persona", "Undefined");
        var newMsg;
        var languages = ['Elvish', 'Binary', 'Magraki', 'Abyssal', 'Draconic', 'Aquon', 'Celestan', 'Technum', 'Arcana', 'Ancient', 'Natrum', 'Ellum', 'Animal', 'Auran', 'Davek', 'Arkadium'].sort();
        for (var i = 0; i < languages.length; i++) {
            newMsg = new MessageStory();
            newMsg.msg = "[" + languages[i] + "]: Nulla luctus quam sit [amet] ullamcorper {luctus}. *Integer* a nulla vitae (blandit tincidunt).";
            newMsg.setSpecial("language", languages[i]);
            list.push(newMsg);
        }
        return list;
    };
    MessageStory.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatMessageStory");
        var container = p;
        var lang = this.getSpecial("language", "none");
        var thisMsg = "";
        var messageNodes = [];
        messageNodes.push(document.createTextNode("- "));
        var currentSpecial = null;
        var specialStarters = ["[", "{", "(", "*"];
        var specialEnders = ["]", "}", ")", "*"];
        var specialClasses = ["chatRoleplayImportant", "chatRoleplayItalic", "chatRoleplayThought", "chatRoleplayAction"];
        var specialInclusive = [true, false, true, true];
        var special;
        for (var i = 0; i < this.msg.length; i++) {
            special = -1;
            if (currentSpecial === null)
                special = specialStarters.indexOf(this.msg.charAt(i));
            else if (specialEnders.indexOf(this.msg.charAt(i)) === currentSpecial) {
                if (specialInclusive[currentSpecial]) {
                    thisMsg += this.msg.charAt(i);
                }
                var span = document.createElement("span");
                span.classList.add(specialClasses[currentSpecial]);
                span.appendChild(document.createTextNode(thisMsg));
                messageNodes.push(span);
                thisMsg = "";
                currentSpecial = null;
                continue;
            }
            if (special !== -1) {
                currentSpecial = special;
                if (lang !== "none") {
                    var ele = document.createElement("span");
                    ele.classList.add("chatRoleplayLang" + lang);
                    ele.appendChild(document.createTextNode(thisMsg));
                    messageNodes.push(ele);
                }
                else {
                    messageNodes.push(document.createTextNode(thisMsg));
                }
                thisMsg = "";
                if (specialInclusive[special])
                    thisMsg += this.msg.charAt(i);
                continue;
            }
            thisMsg += this.msg.charAt(i);
        }
        if (thisMsg !== "") {
            messageNodes.push(document.createTextNode(thisMsg));
        }
        for (var i = 0; i < messageNodes.length; i++) {
            container.appendChild(messageNodes[i]);
        }
        return p;
    };
    return MessageStory;
})(Message);
MessageFactory.registerMessage(MessageStory, "story", ["/story", "/history", "/historia", "/história", "/histo", "/sto"]);
var MessageAction = (function (_super) {
    __extends(MessageAction, _super);
    function MessageAction() {
        _super.apply(this, arguments);
        this.module = "action";
    }
    MessageAction.prototype.findPersona = function () {
        var personaName = UI.Chat.PersonaManager.getPersonaName();
        this.setPersona(personaName === null ? "???" : personaName);
    };
    MessageAction.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatAction");
        var b = document.createElement("b");
        b.appendChild(document.createTextNode("* " + this.getSpecial("persona", "???") + " "));
        p.appendChild(b);
        p.appendChild(document.createTextNode(this.msg));
        return p;
    };
    return MessageAction;
})(Message);
MessageFactory.registerMessage(MessageAction, "action", ["/act", "/me", "/eu", "/açao", "/ação", "/agir"]);
var MessageOff = (function (_super) {
    __extends(MessageOff, _super);
    function MessageOff() {
        _super.apply(this, arguments);
        this.module = "offgame";
    }
    MessageOff.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatOff");
        var b = document.createElement("b");
        b.appendChild(document.createTextNode(this.getUser().getUniqueNickname() + ": "));
        p.appendChild(b);
        p.appendChild(document.createTextNode(this.msg));
        return p;
    };
    return MessageOff;
})(Message);
MessageFactory.registerMessage(MessageOff, "offgame", ["/off", "/ooc"]);
var MessageRoleplay = (function (_super) {
    __extends(MessageRoleplay, _super);
    function MessageRoleplay() {
        _super.call(this);
        this.module = "roleplay";
        this.addUpdatedListener({
            handleEvent: function (e) {
                var lingua = e.getSpecial("lingua", null);
                if (lingua !== null) {
                    e.setSpecial("language", lingua);
                    e.unsetSpecial("lingua");
                }
            }
        });
    }
    MessageRoleplay.prototype.findPersona = function () {
        var personaName = UI.Chat.PersonaManager.getPersonaName();
        this.setPersona(personaName === null ? "???" : personaName);
    };
    MessageRoleplay.prototype.makeMockUp = function () {
        var list = [];
        list.push(this);
        this.msg = "Lorem [ipsum] dolor {sit amet}, *consectetur adipiscing elit*. (Maecenas pellentesque) lectus neque, ac suscipit metus facilisis vitae. Sed ut nisi non massa sagittis molestie non sed libero.";
        this.setSpecial("persona", "Undefined");
        var newMsg = new MessageRoleplay();
        newMsg.msg = "Nulla luctus quam sit amet ullamcorper luctus. Integer a nulla vitae nibh blandit tincidunt id nec tortor. Interdum et malesuada fames ac ante ipsum primis in faucibus.";
        newMsg.setSpecial("persona", "Cabamamimo");
        list.push(newMsg);
        var languages = ['Elvish', 'Binary', 'Magraki', 'Abyssal', 'Draconic', 'Aquon', 'Celestan', 'Technum', 'Arcana', 'Ancient', 'Natrum', 'Ellum', 'Animal', 'Auran', 'Davek', 'Arkadium'].sort();
        for (var i = 0; i < languages.length; i++) {
            newMsg = new MessageRoleplay();
            newMsg.msg = "[" + languages[i] + "]: Nulla luctus quam sit [amet] ullamcorper {luctus}. *Integer* a nulla vitae (blandit tincidunt).";
            newMsg.setSpecial("persona", "Línguoso");
            newMsg.setSpecial("language", languages[i]);
            list.push(newMsg);
        }
        return list;
    };
    MessageRoleplay.prototype.createHTML = function () {
        if (this.isIgnored())
            return null;
        var p = document.createElement("p");
        p.classList.add("chatMessageParagraph");
        var container = p;
        var b = document.createElement("b");
        b.appendChild(document.createTextNode(this.getSpecial("persona", "????") + ": "));
        p.appendChild(b);
        var lang = this.getLanguage();
        var thisMsg = "";
        var messageNodes = [];
        var currentSpecial = null;
        var specialStarters = ["[", "{", "(", "*"];
        var specialEnders = ["]", "}", ")", "*"];
        var specialClasses = ["chatRoleplayImportant", "chatRoleplayItalic", "chatRoleplayThought", "chatRoleplayAction"];
        var specialInclusive = [true, false, true, true];
        var special;
        for (var i = 0; i < this.msg.length; i++) {
            special = -1;
            if (currentSpecial === null)
                special = specialStarters.indexOf(this.msg.charAt(i));
            else if (specialEnders.indexOf(this.msg.charAt(i)) === currentSpecial) {
                if (specialInclusive[currentSpecial]) {
                    thisMsg += this.msg.charAt(i);
                }
                var span = document.createElement("span");
                span.classList.add(specialClasses[currentSpecial]);
                span.appendChild(document.createTextNode(thisMsg));
                messageNodes.push(span);
                thisMsg = "";
                currentSpecial = null;
                continue;
            }
            if (special !== -1) {
                currentSpecial = special;
                if (lang !== "none") {
                    var ele = document.createElement("span");
                    ele.classList.add("chatRoleplayLang" + lang);
                    ele.appendChild(document.createTextNode(thisMsg));
                    messageNodes.push(ele);
                }
                else {
                    messageNodes.push(document.createTextNode(thisMsg));
                }
                thisMsg = "";
                if (specialInclusive[special])
                    thisMsg += this.msg.charAt(i);
                continue;
            }
            thisMsg += this.msg.charAt(i);
        }
        if (thisMsg !== "") {
            if (lang === "none") {
                messageNodes.push(document.createTextNode(thisMsg));
            }
            else {
                var ele = document.createElement("span");
                ele.classList.add("chatRoleplayLang" + lang);
                ele.appendChild(document.createTextNode(thisMsg));
                messageNodes.push(ele);
            }
        }
        for (var i = 0; i < messageNodes.length; i++) {
            container.appendChild(messageNodes[i]);
        }
        var translation = this.getTranslation();
        if (translation !== null) {
            var span = document.createElement("span");
            span.classList.add("chatRoleplayTranslation");
            var b = document.createElement("b");
            b.appendChild(document.createTextNode("_CHATMESSAGEROLEPLAYTRANSLATION_"));
            b.appendChild(document.createTextNode(": "));
            UI.Language.markLanguage(b);
            span.appendChild(b);
            span.appendChild(document.createTextNode(translation));
            p.appendChild(span);
        }
        return p;
    };
    MessageRoleplay.prototype.isIgnored = function () {
        if (!Application.Login.isLogged())
            return false;
        var ignored = this.getSpecial("ignoreFor", []);
        return ignored.indexOf(Application.Login.getUser().id) !== -1;
    };
    MessageRoleplay.prototype.getLanguage = function () {
        var oldLingua = this.getSpecial("lingua", null);
        if (oldLingua !== null)
            return oldLingua;
        var language = this.getSpecial("language", "none");
        return language;
    };
    MessageRoleplay.prototype.setLanguage = function (lang) {
        this.setSpecial("language", lang);
    };
    MessageRoleplay.prototype.setTranslation = function (message) {
        this.setSpecial("translation", message);
    };
    MessageRoleplay.prototype.getTranslation = function () {
        return this.getSpecial('translation', null);
    };
    return MessageRoleplay;
})(Message);
MessageFactory.registerMessage(MessageRoleplay, "roleplay", []);
var MessageUnknown = (function (_super) {
    __extends(MessageUnknown, _super);
    function MessageUnknown() {
        _super.apply(this, arguments);
        this.module = "unkn";
    }
    MessageUnknown.prototype.createHTML = function () {
        var p = document.createElement("p");
        p.classList.add("chatMessageNotification");
        p.appendChild(document.createTextNode("_CHATMESSAGEUNKNOWNTYPE_"));
        UI.Language.addLanguageVariable(p, "a", this.module);
        UI.Language.addLanguageVariable(p, "b", this.getUser().getUser().getFullNickname());
        UI.Language.markLanguage(p);
        return p;
    };
    return MessageUnknown;
})(Message);
MessageFactory.registerMessage(MessageUnknown, "unkn", []);
/// <reference path='MessageFactory.ts' />
/// <reference path='Types/SlashCommand.ts' />
/// <reference path='Types/SlashClear.ts' />
/// <reference path='Types/SlashReply.ts' />
/// <reference path='Types/Message.ts' />
/// <reference path='Types/MessageSystem.ts' />
/// <reference path='Types/MessageCountdown.ts' />
/// <reference path='Types/MessageVote.ts' />
/// <reference path='Types/MessageWebm.ts' />
/// <reference path='Types/MessageVideo.ts' />
/// <reference path='Types/MessageSE.ts' />
/// <reference path='Types/MessageImage.ts' />
/// <reference path='Types/MessageBGM.ts' />
/// <reference path='Types/MessageStream.ts' />
/// <reference path='Types/MessageSheetcommand.ts' />
/// <reference path='Types/MessageWhisper.ts' />
/// <reference path='Types/MessageSheetdamage.ts' />
/// <reference path='Types/MessageSheetturn.ts' />
/// <reference path='Types/MessageDice.ts' />
/// <reference path='Types/MessageStory.ts' />
/// <reference path='Types/MessageAction.ts' />
/// <reference path='Types/MessageOff.ts' />
/// <reference path='Types/MessageRoleplay.ts' />
/// <reference path='Types/MessageUnknown.ts' /> 
var DB;
(function (DB) {
    var UserDB;
    (function (UserDB) {
        var users = {};
        function hasUser(id) {
            return users[id] !== undefined;
        }
        UserDB.hasUser = hasUser;
        function getUser(id) {
            if (hasUser(id)) {
                return users[id];
            }
            return null;
        }
        UserDB.getUser = getUser;
        function getAUser(id) {
            if (hasUser(id))
                return users[id];
            return new User();
        }
        UserDB.getAUser = getAUser;
        function updateFromObject(obj) {
            for (var i = 0; i < obj.length; i++) {
                if (users[obj[i]['id']] === undefined) {
                    users[obj[i]['id']] = new User();
                }
                users[obj[i]['id']].updateFromObject(obj[i]);
            }
        }
        UserDB.updateFromObject = updateFromObject;
    })(UserDB = DB.UserDB || (DB.UserDB = {}));
})(DB || (DB = {}));
var DB;
(function (DB) {
    var GameDB;
    (function (GameDB) {
        var games = {};
        function hasGame(id) {
            return games[id] !== undefined;
        }
        GameDB.hasGame = hasGame;
        function getGame(id) {
            if (hasGame(id)) {
                return games[id];
            }
            return null;
        }
        GameDB.getGame = getGame;
        function getOrderedGameList() {
            var list = [];
            for (var id in games) {
                list.push(games[id]);
            }
            list.sort(function (a, b) {
                var na = a.name.toLowerCase();
                var nb = b.name.toLowerCase();
                if (na < nb)
                    return -1;
                if (nb < na)
                    return 1;
                return 0;
            });
            return list;
        }
        GameDB.getOrderedGameList = getOrderedGameList;
        function updateFromObject(obj, cleanup) {
            var cleanedup = {};
            for (var i = 0; i < obj.length; i++) {
                if (games[obj[i]['id']] === undefined) {
                    games[obj[i]['id']] = new Game();
                }
                games[obj[i]['id']].updateFromObject(obj[i], cleanup);
                cleanedup[obj[i]['id']] = games[obj[i]['id']];
            }
            if (cleanup) {
                games = cleanedup;
            }
        }
        GameDB.updateFromObject = updateFromObject;
    })(GameDB = DB.GameDB || (DB.GameDB = {}));
})(DB || (DB = {}));
var DB;
(function (DB) {
    var RoomDB;
    (function (RoomDB) {
        RoomDB.rooms = {};
        function hasRoom(id) {
            return RoomDB.rooms[id] !== undefined;
        }
        RoomDB.hasRoom = hasRoom;
        function getRoom(id) {
            if (hasRoom(id)) {
                return RoomDB.rooms[id];
            }
            return null;
        }
        RoomDB.getRoom = getRoom;
        function releaseRoom(id) {
            if (hasRoom(id)) {
                delete (this.rooms[id]);
                return true;
            }
            return false;
        }
        RoomDB.releaseRoom = releaseRoom;
        function updateFromObject(obj, cleanup) {
            for (var i = 0; i < obj.length; i++) {
                var room = obj[i];
                if (RoomDB.rooms[room['id']] === undefined) {
                    RoomDB.rooms[room['id']] = new Room();
                }
                RoomDB.rooms[room['id']].updateFromObject(room, cleanup);
            }
        }
        RoomDB.updateFromObject = updateFromObject;
    })(RoomDB = DB.RoomDB || (DB.RoomDB = {}));
})(DB || (DB = {}));
var DB;
(function (DB) {
    var MessageDB;
    (function (MessageDB) {
        MessageDB.messageById = {};
        var messageByLocalId = {};
        var lastLocal = 0;
        function releaseMessage(id) {
            if (hasMessage(id)) {
                delete (MessageDB.messageById[id]);
                return true;
            }
            return false;
        }
        MessageDB.releaseMessage = releaseMessage;
        function releaseLocalMessage(id) {
            if (hasLocalMessage(id)) {
                messageByLocalId[id].localid = null;
                delete (messageByLocalId[id]);
                return true;
            }
            return false;
        }
        MessageDB.releaseLocalMessage = releaseLocalMessage;
        function releaseAllLocalMessages() {
            for (var id in messageByLocalId) {
                releaseLocalMessage(id);
            }
        }
        MessageDB.releaseAllLocalMessages = releaseAllLocalMessages;
        function hasMessage(id) {
            return MessageDB.messageById[id] !== undefined;
        }
        MessageDB.hasMessage = hasMessage;
        function hasLocalMessage(id) {
            return messageByLocalId[id] !== undefined;
        }
        MessageDB.hasLocalMessage = hasLocalMessage;
        function getMessage(id) {
            if (hasMessage(id))
                return MessageDB.messageById[id];
            return null;
        }
        MessageDB.getMessage = getMessage;
        function getLocalMessage(id) {
            if (hasLocalMessage(id))
                return messageByLocalId[id];
            return null;
        }
        MessageDB.getLocalMessage = getLocalMessage;
        function registerLocally(msg) {
            msg.localid = lastLocal++;
            messageByLocalId[msg.localid] = msg;
        }
        MessageDB.registerLocally = registerLocally;
        function updateFromObject(obj) {
            for (var i = 0; i < obj.length; i++) {
                if (obj[i]['localid'] !== undefined && hasLocalMessage(obj[i]['localid'])) {
                    MessageDB.messageById[obj[i]['id']] = getLocalMessage(obj[i]['localid']);
                }
                else if (!hasMessage(obj[i]['id'])) {
                    MessageDB.messageById[obj[i]['id']] = MessageFactory.createMessageFromType(obj[i]['module']);
                }
                MessageDB.messageById[obj[i]['id']].updateFromObject(obj[i]);
            }
        }
        MessageDB.updateFromObject = updateFromObject;
    })(MessageDB = DB.MessageDB || (DB.MessageDB = {}));
})(DB || (DB = {}));
var DB;
(function (DB) {
    var SheetDB;
    (function (SheetDB) {
        var sheets = {};
        var changeListeners = [];
        function addChangeListener(list) {
            this.changeListeners.push(list);
        }
        SheetDB.addChangeListener = addChangeListener;
        function removeChangeListener(list) {
            var i = changeListeners.indexOf(list);
            if (i !== -1) {
                changeListeners.splice(i, 1);
            }
        }
        SheetDB.removeChangeListener = removeChangeListener;
        function triggerChanged(sheet) {
            for (var i = 0; i < this.changeListeners.length; i++) {
                this.changeListeners[i].handleEvent(sheet);
            }
        }
        SheetDB.triggerChanged = triggerChanged;
        function hasSheet(id) {
            return sheets[id] !== undefined;
        }
        SheetDB.hasSheet = hasSheet;
        function getSheet(id) {
            if (hasSheet(id)) {
                return sheets[id];
            }
            return null;
        }
        SheetDB.getSheet = getSheet;
        function releaseSheet(id) {
            if (hasSheet(id)) {
                delete (sheets[id]);
            }
        }
        SheetDB.releaseSheet = releaseSheet;
        function updateFromObject(obj) {
            for (var i = 0; i < obj.length; i++) {
                if (sheets[obj[i]['id']] === undefined) {
                    sheets[obj[i]['id']] = new SheetInstance();
                }
                sheets[obj[i]['id']].updateFromObject(obj[i]);
            }
            triggerChanged(null);
        }
        SheetDB.updateFromObject = updateFromObject;
    })(SheetDB = DB.SheetDB || (DB.SheetDB = {}));
})(DB || (DB = {}));
/// <reference path='DB.ts' />
/// <reference path='Modules/UserDB.ts' />
/// <reference path='Modules/GameDB.ts' />
/// <reference path='Modules/RoomDB.ts' />
/// <reference path='Modules/MessageDB.ts' />
/// <reference path='Modules/UserDB.ts' />
/// <reference path='Modules/SheetDB.ts' /> 
var Application;
(function (Application) {
    function getMe() {
        return Application.Login.getUser();
    }
    Application.getMe = getMe;
    function isMe(id) {
        if (!Application.Login.isLogged())
            return false;
        return Application.Login.getUser().id === id;
    }
    Application.isMe = isMe;
    function getMyId() {
        if (getMe() !== null) {
            return getMe().id;
        }
        return 0;
    }
    Application.getMyId = getMyId;
})(Application || (Application = {}));
var Application;
(function (Application) {
    var Config;
    (function (Config) {
        var configList = {};
        function getConfig(id) {
            return configList[id];
        }
        Config.getConfig = getConfig;
        function registerChangeListener(id, listener) {
            if (configList[id] === undefined) {
                console.warn("[CONFIG] Attempt to register a listener to unregistered configuration at " + id + ". Offending listener:", listener);
                return;
            }
            configList[id].addChangeListener(listener);
        }
        Config.registerChangeListener = registerChangeListener;
        function registerConfiguration(id, config) {
            if (configList[id] !== undefined) {
                console.warn("[CONFIG] Attempt to overwrite registered Configuration at " + id + ". Offending configuration:", config);
                return;
            }
            configList[id] = config;
        }
        Config.registerConfiguration = registerConfiguration;
        function exportAsObject() {
            var result = {};
            for (var key in configList) {
                result[key] = configList[key].getValue();
            }
            return result;
        }
        Config.exportAsObject = exportAsObject;
        function updateFromObject(obj) {
            for (var key in obj) {
                if (configList[key] === undefined) {
                    console.warn("[CONFIG] Unregistered configuration at " + key + ". It will be discarded. Value: ", obj[key]);
                    continue;
                }
                configList[key].storeValue(obj[key]);
            }
            console.debug("[CONFIG] Updated configuration values from:", obj);
        }
        Config.updateFromObject = updateFromObject;
    })(Config = Application.Config || (Application.Config = {}));
})(Application || (Application = {}));
var Application;
(function (Application) {
    var LocalMemory;
    (function (LocalMemory) {
        function getMemoryName(id) {
            return "redpg_" + Application.Login.getUser().id + "_" + id;
        }
        function getMemory(id, defaultValue) {
            if (Application.Login.isLogged()) {
                var value = localStorage.getItem(getMemoryName(id));
                if (value !== null) {
                    return JSON.parse(value);
                }
            }
            return defaultValue;
        }
        LocalMemory.getMemory = getMemory;
        function setMemory(id, value) {
            if (Application.Login.isLogged()) {
                localStorage.setItem(getMemoryName(id), JSON.stringify(value));
            }
        }
        LocalMemory.setMemory = setMemory;
        function unsetMemory(id) {
            if (Application.Login.isLogged()) {
                localStorage.removeItem(getMemoryName(id));
            }
        }
        LocalMemory.unsetMemory = unsetMemory;
    })(LocalMemory = Application.LocalMemory || (Application.LocalMemory = {}));
})(Application || (Application = {}));
/// <reference path='../Application.ts' />
var Application;
(function (Application) {
    var Login;
    (function (Login) {
        var currentUser = null;
        var currentSession = null;
        var lastEmail = null;
        var lastUpdate = null;
        var sessionLife = 30 * 60 * 1000;
        var keepAliveTime = 2 * 60 * 1000;
        var interval = null;
        var listeners = [];
        var LAST_LOGIN_STORAGE = "redpg_lastLogin";
        var LAST_SESSION_STORAGE = "redpg_lastSession";
        var LAST_SESSION_TIME_STORAGE = "redpg_lastSessionTime";
        function searchLogin() {
            if (localStorage.getItem(LAST_LOGIN_STORAGE) !== null) {
                lastEmail = localStorage.getItem(LAST_LOGIN_STORAGE);
            }
            else {
                lastEmail = null;
            }
            if (localStorage.getItem(LAST_SESSION_STORAGE) !== null) {
                var currentTime = new Date().getTime();
                var lastTime = parseInt(localStorage.getItem(LAST_SESSION_TIME_STORAGE));
                if ((currentTime - lastTime) <= sessionLife) {
                    currentSession = localStorage.getItem(LAST_SESSION_STORAGE);
                    lastUpdate = lastTime.toString();
                }
            }
        }
        Login.searchLogin = searchLogin;
        function hasLastEmail() {
            return lastEmail !== null;
        }
        Login.hasLastEmail = hasLastEmail;
        function getLastEmail() {
            return lastEmail;
        }
        Login.getLastEmail = getLastEmail;
        function isLogged() {
            return currentUser !== null;
        }
        Login.isLogged = isLogged;
        function hasSession() {
            return currentSession !== null;
        }
        Login.hasSession = hasSession;
        function getSession() {
            return currentSession;
        }
        Login.getSession = getSession;
        function logout() {
            var oldLogged = isLogged();
            currentSession = null;
            currentUser = null;
            if (interval !== null)
                window.clearInterval(interval);
            interval = null;
            localStorage.removeItem(LAST_SESSION_STORAGE);
            localStorage.removeItem(LAST_SESSION_TIME_STORAGE);
            if (oldLogged !== isLogged()) {
                triggerListeners();
            }
        }
        Login.logout = logout;
        function attemptLogin(email, password, cbs, cbe) {
            lastEmail = email;
            updateLocalStorage();
            Server.Login.doLogin(email, password, cbs, cbe);
        }
        Login.attemptLogin = attemptLogin;
        function receiveLogin(userJson, sessionid) {
            var oldLogged = isLogged();
            var oldUser = currentUser;
            currentSession = sessionid;
            currentUser = new User();
            currentUser.updateFromObject(userJson);
            updateSessionLife();
            if (interval !== null)
                window.clearInterval(interval);
            interval = window.setInterval(function () {
                Application.Login.keepAlive();
            }, keepAliveTime);
            if (!oldLogged || oldUser.id !== currentUser.id) {
                triggerListeners();
            }
        }
        Login.receiveLogin = receiveLogin;
        function updateSessionLife() {
            lastUpdate = new Date().getTime().toString();
            updateLocalStorage();
        }
        Login.updateSessionLife = updateSessionLife;
        function updateLocalStorage() {
            if (lastEmail !== null) {
                localStorage.setItem(LAST_LOGIN_STORAGE, lastEmail);
            }
            if (hasSession()) {
                if (lastUpdate !== null) {
                    localStorage.setItem(LAST_SESSION_STORAGE, currentSession);
                    localStorage.setItem(LAST_SESSION_TIME_STORAGE, lastUpdate);
                }
                else {
                    localStorage.removeItem(LAST_SESSION_STORAGE);
                    localStorage.removeItem(LAST_SESSION_TIME_STORAGE);
                }
            }
        }
        Login.updateLocalStorage = updateLocalStorage;
        function keepAlive() {
            var cbs = {
                handleEvent: function () {
                    Application.Login.updateSessionLife();
                }
            };
            Server.Login.requestSession(true, cbs);
        }
        Login.keepAlive = keepAlive;
        function addListener(listener) {
            listeners.push(listener);
        }
        Login.addListener = addListener;
        function getUser() {
            return currentUser;
        }
        Login.getUser = getUser;
        function triggerListeners() {
            for (var i = 0; i < listeners.length; i++) {
                listeners[i].handleEvent(isLogged());
            }
        }
    })(Login = Application.Login || (Application.Login = {}));
})(Application || (Application = {}));
/// <reference path='Application.ts' />
/// <reference path='Modules/Config.ts' />
/// <reference path='Modules/LocalMemory.ts' />
/// <reference path='Modules/Login.ts' /> 
var Lingo = (function () {
    function Lingo() {
        this.ids = [];
        this.unknownLingo = " :( ";
        this.langValues = {};
    }
    Lingo.prototype.setLingo = function (id, value) {
        this.langValues[id] = value;
    };
    Lingo.prototype.getLingo = function (id, dataset) {
        if (this.langValues[id] === undefined) {
            console.warn("[LANGUAGE] No string for \"" + id + "\" in " + this.name + ".");
            return this.unknownLingo;
        }
        var result = this.langValues[id];
        var number = "a".charCodeAt(0);
        while (dataset["language" + String.fromCharCode(number)] !== undefined) {
            result = result.replace(new RegExp("%" + String.fromCharCode(number), 'g'), dataset["language" + String.fromCharCode(number)]);
            number++;
        }
        return result;
    };
    return Lingo;
})();
var LingoList;
(function (LingoList) {
    var lingos = {};
    function getLingo(id) {
        id = id.toLowerCase().trim();
        if (lingos[id] !== undefined) {
            return lingos[id];
        }
        id = id.split("-")[0];
        if (lingos[id] !== undefined) {
            return lingos[id];
        }
        return lingos["pt"];
    }
    LingoList.getLingo = getLingo;
    function storeLingo(lingo) {
        for (var i = 0; i < lingo.ids.length; i++) {
            lingos[lingo.ids[i]] = lingo;
        }
    }
    LingoList.storeLingo = storeLingo;
})(LingoList || (LingoList = {}));
var ptbr = new Lingo();
ptbr.ids = ["pt", "pt-br"];
ptbr.name = "Português - Brasil";
ptbr.shortname = "Português";
ptbr.setLingo("_LOGINEMAIL_", "E-mail");
ptbr.setLingo("_LOGINPASSWORD_", "Senha");
ptbr.setLingo("_LOGINSUBMIT_", "Entrar");
ptbr.setLingo("_CHANGELOGTITLE_", "Histórico de mudanças");
ptbr.setLingo("_CHANGELOGP1_", "Para receber os updates marcados em vermelho você precisa atualizar sua aplicação para a última versão.");
ptbr.setLingo("_CHANGELOGP2_", "Compatibilidade com versões anteriores não é intencional. Não existem garantias de que versões desatualizadas funcionem e é recomendável sempre utilizar a versão mais recente do aplicativo.");
ptbr.setLingo("_CHANGELOGCURRENTVERSION_", "A sua versão é");
ptbr.setLingo("_CHANGELOGMOSTRECENTVERSION_", "A versão mais recente é");
ptbr.setLingo("_REDPGTITLE_", "RedPG");
ptbr.setLingo("_REDPGEXP1_", "RedPG é um sistema para facilitar RPGs de Mesa através da internet. Funções do sistema incluem o compartilhamento de Imagens, Sons, Fichas de Personagens, uma sala para troca de mensagens com suporte a dados e muito mais, com novas funções sempre sendo adicionadas.");
ptbr.setLingo("_REDPGEXP2_", "Todos os aspectos do sistema existem e estão presos às Mesas, que ele enxerga como um grupo de RPG. Então para criar qualquer coisa ou utilizar o sistema de qualquer maneira, você precisa criar ou ser convidado a uma Mesa. Isso é feito na seção \"Mesas\", no menu à esquerda.");
ptbr.setLingo("_REDPGFORUMTITLE_", "Últimos posts no Fórum");
ptbr.setLingo("_REDPGFORUM1_", "Não Implementado");
ptbr.setLingo("_REDPGDONATIONTITLE_", "Doações");
ptbr.setLingo("_REDPGDONATIONEXP1_", "RedPG é um sistema gratuito e permanecerá gratuito enquanto isso for possível. Mas o servidor possui um custo e alguém precisa pagar.");
ptbr.setLingo("_REDPGDONATIONEXP2_", "Através de doações, você funda o desenvolvimento do sistema e ajuda a pagar as mensalidades do servidor. Com a ajuda de todos, RedPG poderá ser grátis para sempre!");
ptbr.setLingo("_REDPGDONATIONEXP3_", "Sempre que fizer uma doação, tente realizar ela a partir de uma conta registrada no mesmo nome registrado no RedPG. Assim, no futuro suas doações poderão ser contabilizadas pelo sistema do RedPG!");
ptbr.setLingo("_REDPGLINKSTITLE_", "Links úteis");
ptbr.setLingo("_REDPGLINKFRONTBUTTON_", "RedPG Front on GitHub");
ptbr.setLingo("_REDPGLINKFRONTEXP_", "Versão offline do cliente RedPG. Usuários que queiram abrir o RedPG a partir da própria máquina devem baixar versões atualizadas aqui. A versão offline permite que jogadores e mestres compartilhem sons que estejam dentro da pasta Sons, sem a necessidade de um servidor para compartilhar sons.");
ptbr.setLingo("_MENULOGOUT_", "Logout");
ptbr.setLingo("_MENUGAMES_", "Mesas");
ptbr.setLingo("_MENUCONFIG_", "Opções");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("_GAMESTITLE_", "Mesas");
ptbr.setLingo("_GAMESEXP1_", "Caso precise informar seu identificador para alguém, ele é \"%a\", sem as aspas.");
ptbr.setLingo("_GAMESEXP2_", "Aqui você pode administrar as mesas das quais você participa. Para convidar jogadores à sua mesa, você irá precisar do identificador deles.");
ptbr.setLingo("_GAMESEXP3_", "Uma mesa nesse sistema é o lugar no qual todas as outras partes do sistema se conectam. As salas, o ambiente no qual as partidas são jogadas, ficam anexadas à uma mesa. As fichas de personagens ficam anexadas à uma mesa.");
ptbr.setLingo("_GAMESEXP4_", "No momento não é possível pedir uma lista de mesas de livre entrada (não implementados).");
ptbr.setLingo("_GAMESINVITES_", "Meus convites");
ptbr.setLingo("_GAMESNEWGAME_", "Criar novo jogo");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("_CHATHELP01_", "Use \"/comandos\" para imprimir uma lista completa de comandos. Comandos básicos:");
ptbr.setLingo("_CHATHELP02_", "\"/me [mensagem]\": Envia a mensagem como uma ação da persona escolhida.");
ptbr.setLingo("_CHATHELP03_", "\"/off [mensagem]\": Envia a mensagem como uma mensagem fora de jogo, falando como o jogador.");
ptbr.setLingo("_CHATHELP04_", "\"/story [mensagem]\": Envia a mensagem como uma mensagem de história, disponível apenas para narradores.");
ptbr.setLingo("_CHATHELP05_", "Alternativamente, segure Alt, Control ou Shift quando for enviar a mensagem.");
ptbr.setLingo("_CHATHELP06_", "É recomendável executar \"/clear 1\" para limpar as mensagens no servidor de vez em quando, ou a sala ficará cada vez mais lenta.");
ptbr.setLingo("_CHATHELP07_", "Caso deseje usar as músicas em modo offline, mas o RedPG em modo online, clique no formulário abaixo e escolha suas músicas: você estará dando permissão temporária para o RedPG acessá-las.");
ptbr.setLingo("_CHATEMPTYNOTALLOWED_", "Mensagens vazias não são permitidas. Para limpar a tela de mensagens, digite \"/clear\".");
ptbr.setLingo("_CHATMESSAGENOTSENT_", "Houve um erro no envio da mensagem acima.");
ptbr.setLingo("_CHATMESSAGENOTSENTRESEND_", "Clique aqui para tentar novamente.");
ptbr.setLingo("_CHATHASCONNECTED_", "entrou na sala.");
ptbr.setLingo("_CHATHASDISCONNECTED_", "saiu da sala.");
ptbr.setLingo("_CHATOLDMESSAGESNOTLOADED_", "Mensagens antigas não foram impressas.");
ptbr.setLingo("_CHATOLDMESSAGESLOAD_", "Clique aqui para carregar todas as mensagens dessa sala.");
ptbr.setLingo("_CHATYOUAREDISCONNECTED_", "Você foi desconectado.");
ptbr.setLingo("_CHATDISCONNECTEDRECONNECT_", "Clique aqui para reconectar.");
ptbr.setLingo("_CHATNOTALLMESSAGES_", "Algumas mensagens não foram impressas por estarem acima do limite atual de mensagens. Você pode aumentar o limite de mensagens em Opções.");
ptbr.setLingo("_CHATRECONNECTINGEXP_", "Você foi desconectado. Tentando reconectar...");
ptbr.setLingo("_CHATDISCONNECTEDEXP_", "Você está desconectado.");
ptbr.setLingo("_CHATMESSAGEROLEPLAYTRANSLATION_", "Tradução");
ptbr.setLingo("_CHATMESSAGEUNKNOWNTYPE_", "Mensagem de tipo desconhecido \"%a\", enviada por %b.");
ptbr.setLingo("_CHATSENDER_", "Jogador");
ptbr.setLingo("_CHATSENDERSTORYTELLER_", "Mestre");
ptbr.setLingo("_CHATDICEROLLED_", "rolou");
ptbr.setLingo("_CHATDICESECRETROLLED_", "secretamente rolou");
ptbr.setLingo("_CHATDICESHOWN_", "mostrou");
ptbr.setLingo("_CHATDICESECRETSHOWN_", "secretamente mostrou");
ptbr.setLingo("_CHATMESSAGEDICEREASON_", "Motivo");
ptbr.setLingo("_CHATMESSAGEWHISPERTO_", "Mensagem enviada para");
ptbr.setLingo("_CHATMESSAGEWHISPERFROM_", "Mensagem recebida de");
ptbr.setLingo("_CHATMESSAGESHAREDBGM_", "compartilhou um som");
ptbr.setLingo("_CHATMESSAGEPLAYBGM_", "Tocar");
ptbr.setLingo("_CHATMESSAGESHAREDIMAGE_", "compartilhou uma imagem");
ptbr.setLingo("_CHATMESSAGESEEIMAGE_", "Ver");
ptbr.setLingo("_CHATMESSAGESHAREDSE_", "compartilhou um efeito sonoro");
ptbr.setLingo("_CHATMESSAGEPLAYSE_", "Ouvir");
ptbr.setLingo("_CHATMESSAGESHAREDVIDEO_", "compartilhou um video");
ptbr.setLingo("_CHATMESSAGEPLAYVIDEO_", "Assistir");
ptbr.setLingo("_CHATMESSAGEVOTECREATEDVOTE_", "criou uma votação");
ptbr.setLingo("_CHATDICEROLLEDWAITING_", "Esperando resposta do servidor...");
ptbr.setLingo("_CHATDICEAMOUNT_", "#");
ptbr.setLingo("_CHATDICEFACES_", "d#");
ptbr.setLingo("_CHATDICEMOD_", "mod");
ptbr.setLingo("_CHATDICEREASON_", "Razão");
ptbr.setLingo("_CHATWHISPERNOTARGETSFOUND_", "Nenhum jogador encontrado para \"%a\".");
ptbr.setLingo("_CHATMULTIPLETARGETSFOUND_", "Múltiplos jogadores encontrados");
ptbr.setLingo("_CHATINVALIDCOMMAND_", "Comando inválido. Digite \"/comandos\" para imprimir uma lista completa de comandos.");
ptbr.setLingo("_CHATBGMERROR_", "Erro ao tocar música.");
ptbr.setLingo("_CHATSEERROR_", "Erro ao tocar efeito sonoro.");
ptbr.setLingo("_CHATSOUNDADDMORE_", "Clique aqui para alterar músicas em uso.");
ptbr.setLingo("_CHATMESSAGEANNOUNCEMENT_", "AVISO DO SISTEMA");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("_PERSONADESIGNERTITLE_", "Administrador de Personas");
ptbr.setLingo("_PERSONADESIGNERNAME_", "Nome do Personagem");
ptbr.setLingo("_PERSONADESIGNERAVATAR_", "Link para Imagem (Opcional)");
ptbr.setLingo("_PERSONADESIGNERCREATE_", "Criar");
ptbr.setLingo("_CHATPERSONADESIGNERUSE_", "Usar essa persona");
ptbr.setLingo("_CHATPERSONADESIGNERDELETE_", "Deletar essa persona");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("_CONFIGTITLE_", "Configurações");
ptbr.setLingo("_CONFIGCHATFONTSIZE_", "(Chat) Tamanho da fonte:");
ptbr.setLingo("_CONFIGCHATFONTFAMILY_", "(Chat) Fonte:");
ptbr.setLingo("_CHATFONTSIZEEXP01_", "Define o tamanho da fonte utilizada no chat.");
ptbr.setLingo("_CHATFONTSIZEEXP02_", "A fonte se torna menor para a esquerda e maior para a direita.");
ptbr.setLingo("_CHATFONTFAMILEXP01_", "Define qual é a fonte utilizada no Chat. Você pode utilizar qualquer fonte disponível no seu computador.");
ptbr.setLingo("_CHATFONTFAMILEXP02_", "A fonte usada no RedPG é \"Alegreya\". A fonte utilizada no antigo chat do RedPG é \"Caudex\" e ainda está disponível.");
ptbr.setLingo("_CONFIGCHATHELP_", "(Chat) Mostrar texto de ajuda:");
ptbr.setLingo("_CONFIGCHATHELPEXP_", "O texto de ajuda é o guia rápido de utilização do Chat que é normalmente impresso no topo da sala. Essa opção pode esconder esse texto.");
ptbr.setLingo("_CONFIGCHATHELPOP01_", "Imprimir mensagens de ajuda");
ptbr.setLingo("_CONFIGCHATHELPOP02_", "Não imprimir mensagens de ajuda");
ptbr.setLingo("_CONFIGANIMATIONTIME_", "Duração de animações:");
ptbr.setLingo("_ANIMATIONTIMEEXP01_", "Todas as animações do RedPG serão proporcionais a essa configuração.");
ptbr.setLingo("_ANIMATIONTIMEEXP02_", "Abaixar essa configuração pode ajudar em dispositivos mais lentos que estejam tendo dificuldades em processar as animações do RedPG.");
ptbr.setLingo("_CONFIGCHATAUTOEXP_", "Quando recebendo compartilhamentos no Chat, essa opção define quando o compartilhamento é aceito automaticamente. Você sempre pode aceitar manualmente.");
ptbr.setLingo("_CONFIGCHATAUTONEVER_", "Nunca");
ptbr.setLingo("_CONFIGCHATAUTOSOMETIMES_", "Apenas quando enviado pelo narrador");
ptbr.setLingo("_CONFIGCHATAUTOALWAYS_", "Sempre");
ptbr.setLingo("_CONFIGCHATAUTOBGM_", "(Chat) Aceitar músicas:");
ptbr.setLingo("_CONFIGCHATAUTOSE_", "(Chat) Aceitar efeitos sonoros:");
ptbr.setLingo("_CONFIGCHATAUTOIMAGE_", "(Chat) Aceitar imagens:");
ptbr.setLingo("_CONFIGCHATAUTOVIDEO_", "(Chat) Aceitar vídeos:");
ptbr.setLingo("_CONFIGCHATMAXMESSAGESEXP01_", "Define quantas mensagens podem estar impressas no chat ao mesmo tempo. Mínimo de 60 mensagens e máximo de 10000 mensagens. Escolha de acordo com seu CPU.");
ptbr.setLingo("_CONFIGCHATMAXMESSAGESEXP02_", "Essa opção é ignorada e se torna 60 quando utilizando dispositivos móveis.");
ptbr.setLingo("_CONFIGCHATMAXMESSAGES_", "(Chat) Número de mensagens:");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
LingoList.storeLingo(ptbr);
delete (ptbr);
var UI;
(function (UI) {
    UI.idChangelog = "changelogSideWindow";
    UI.idGames = "gamesSideWindow";
    UI.idChat = "chatSideWindow";
    UI.idConfig = "configSideWindow";
    UI.idHome = "homeSideWindow";
    Application.Config.registerConfiguration("chatMaxMessages", new NumberConfiguration(120, 60, 10000));
    Application.Config.registerConfiguration("chatshowhelp", new BooleanConfiguration(true));
    Application.Config.registerConfiguration("chatfontsize", new NumberConfiguration(16, 12, 32));
    Application.Config.registerConfiguration("chatfontfamily", new Configuration("caudex"));
    Application.Config.registerConfiguration("animTime", new NumberConfiguration(150, 0, 300));
    Application.Config.registerConfiguration("language", new LanguageConfiguration());
    Application.Config.registerConfiguration("fsmode", new BooleanConfiguration(false));
    Application.Config.registerConfiguration("chatuseprompt", new BooleanConfiguration(true));
    Application.Config.registerConfiguration("autoImage", new NumberConfiguration(1, 0, 2));
    Application.Config.registerConfiguration("autoBGM", new NumberConfiguration(1, 0, 2));
    Application.Config.registerConfiguration("autoSE", new NumberConfiguration(1, 0, 2));
    Application.Config.registerConfiguration("autoVIDEO", new NumberConfiguration(1, 0, 2));
    Application.Config.registerConfiguration("bgmVolume", new NumberConfiguration(50, 25, 100));
    Application.Config.registerConfiguration("seVolume", new NumberConfiguration(50, 25, 100));
    Application.Config.registerConfiguration("bgmLoop", new BooleanConfiguration(true));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var WindowManager;
    (function (WindowManager) {
        var currentWindow = "";
        var windowList = {};
        var style = document.createElement('style');
        style.type = 'text/css';
        document.head.appendChild(style);
        var lastStyleInnerHTML = "";
        (function () {
            var children = document.body.children;
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child.classList.contains("window")) {
                    windowList[child.getAttribute("id")] = child;
                }
            }
        })();
        function callWindow(id) {
            if (windowList[id] === undefined) {
                console.log("--- Error: Attempt to call inexistent window: " + id + ", ignoring.");
                return;
            }
            if (id === currentWindow)
                return;
            if (currentWindow === "") {
                console.debug("Detaching all windows.");
                for (var key in windowList) {
                    document.body.removeChild(windowList[key]);
                }
            }
            else {
                console.debug("Detaching current window: " + currentWindow);
                document.body.removeChild(windowList[currentWindow]);
            }
            currentWindow = id;
            console.debug("Appending window: " + id);
            document.body.appendChild(windowList[currentWindow]);
        }
        WindowManager.callWindow = callWindow;
        function updateWindowSizes() {
            var stylehtml = "";
            var totalWidth = window.innerWidth;
            var rightSize = 698;
            var leftSize = 35 + 340 + 100;
            var remainingSize = totalWidth - rightSize - leftSize - 20;
            if (remainingSize > 255) {
                remainingSize = 255 + ((remainingSize - 255) * 1 / 2);
            }
            if (remainingSize < 0 || Application.Config.getConfig("fsmode").getValue()) {
                UI.Handles.setAlwaysUp(true);
                leftSize = totalWidth - 120;
                rightSize = leftSize;
                stylehtml += ".rightSideWindow { background-color: rgba(0,0,0,.5);} ";
            }
            else {
                UI.Handles.setAlwaysUp(false);
                leftSize += Math.floor(remainingSize / 85) * 85;
                rightSize = totalWidth - leftSize - 20;
            }
            stylehtml += ".leftSideWindow { width: " + leftSize + "px; }\n.rightSideWindow { width: " + rightSize + "px; }";
            WindowManager.currentLeftSize = leftSize;
            WindowManager.currentRightSize = rightSize;
            if (UI.Handles.isAlwaysUp()) {
                stylehtml += "\n.leftSideWindow { left: 60px; }\n.rightSideWindow { right: 60px; }";
            }
            if (stylehtml !== lastStyleInnerHTML) {
                style.innerHTML = stylehtml;
                lastStyleInnerHTML = stylehtml;
            }
        }
        WindowManager.updateWindowSizes = updateWindowSizes;
        window.addEventListener("resize", function () {
            UI.WindowManager.updateWindowSizes();
        });
    })(WindowManager = UI.WindowManager || (UI.WindowManager = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var Config;
    (function (Config) {
        document.getElementById("configButton").addEventListener("click", function () { UI.PageManager.callPage(UI.idConfig); });
        function bindInput(configName, input) {
            Application.Config.getConfig(configName).addChangeListener({
                input: input,
                handleEvent: function (config) {
                    this.input.value = config.getValue().toString();
                }
            });
            input.addEventListener("change", {
                configName: configName,
                input: input,
                handleEvent: function () {
                    Application.Config.getConfig(this.configName).storeValue(this.input.value);
                }
            });
            input.value = Application.Config.getConfig(configName).getValue().toString();
        }
        Config.bindInput = bindInput;
        bindInput("chatfontfamily", document.getElementById("configChatFontFamily"));
        bindInput("chatMaxMessages", document.getElementById("configChatMaxMessages"));
        bindInput("chatfontsize", document.getElementById("configChatFontSize"));
        bindInput("chatshowhelp", document.getElementById("configChatShowHelp"));
        bindInput("animTime", document.getElementById("configAnimTime"));
        bindInput("autoBGM", document.getElementById("configChatAutoBGM"));
        bindInput("autoSE", document.getElementById("configChatAutoSE"));
        bindInput("autoImage", document.getElementById("configChatAutoImage"));
        bindInput("autoVIDEO", document.getElementById("configChatAutoVideo"));
    })(Config = UI.Config || (UI.Config = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var PageManager;
    (function (PageManager) {
        var $currentLeft = null;
        var $currentRight = null;
        var mainWindow = document.getElementById("mainWindow");
        PageManager.$pages = {};
        function getAnimationTime() {
            return Application.Config.getConfig("animTime").getValue() * 2;
        }
        PageManager.getAnimationTime = getAnimationTime;
        function callPage(id) {
            var animationTime = getAnimationTime();
            var $page = PageManager.$pages[id];
            if ($page === undefined) {
                return console.log("Attempt to call inexistent page at " + id + ". Ignoring.");
            }
            if ($page[0].classList.contains("leftSideWindow")) {
                if (UI.Handles.isAlwaysUp() && $currentRight !== null)
                    closeRightPage();
                if ($currentLeft !== null && $page[0] === $currentLeft[0])
                    return;
                var offLeft = (UI.Handles.isAlwaysUp() ? 60 : 10) - UI.WindowManager.currentLeftSize;
                closeLeftPage();
                mainWindow.appendChild($page[0]);
                $page[0].style.left = offLeft + "px";
                $page.finish().animate({
                    left: (UI.Handles.isAlwaysUp() ? 60 : 10)
                }, animationTime, function () {
                    this.style.left = "";
                });
                $currentLeft = $page;
            }
            else {
                if ($currentRight !== null && $page[0] === $currentRight[0])
                    return;
                closeRightPage();
                var offRight = (UI.Handles.isAlwaysUp() ? 60 : 10) - UI.WindowManager.currentRightSize;
                mainWindow.appendChild($page[0]);
                $page[0].style.right = offRight + "px";
                $page.finish().animate({
                    right: (UI.Handles.isAlwaysUp() ? 60 : 10)
                }, animationTime, function () {
                    this.style.right = "";
                });
                $currentRight = $page;
            }
            UI.Language.updateScreen($page[0]);
        }
        PageManager.callPage = callPage;
        function closeLeftPage() {
            var offLeft = (UI.Handles.isAlwaysUp() ? 60 : 10) - UI.WindowManager.currentLeftSize;
            var animationTime = getAnimationTime();
            if ($currentLeft !== null) {
                $currentLeft.animate({
                    left: offLeft
                }, animationTime, function () {
                    this.style.left = "";
                    this.parentElement.removeChild(this);
                });
                $currentLeft = null;
            }
        }
        PageManager.closeLeftPage = closeLeftPage;
        function closeRightPage() {
            if ($currentRight === null)
                return;
            var animationTime = getAnimationTime();
            var offRight = (UI.Handles.isAlwaysUp() ? 60 : 10) - UI.WindowManager.currentRightSize;
            $currentRight.finish().animate({
                right: offRight
            }, animationTime, function () {
                this.style.right = "";
                this.parentElement.removeChild(this);
            });
            $currentRight = null;
        }
        PageManager.closeRightPage = closeRightPage;
        ;
        function readWindows() {
            var children = mainWindow.children;
            for (var i = children.length - 1; i >= 0; i--) {
                var child = children[i];
                if (child.getAttribute("id") !== null && (child.classList.contains("leftSideWindow") || child.classList.contains("rightSideWindow"))) {
                    if (child.classList.contains("dontDetach")) {
                        continue;
                    }
                    PageManager.$pages[child.getAttribute("id")] = $(child);
                    mainWindow.removeChild(child);
                }
            }
        }
        PageManager.readWindows = readWindows;
        function getCurrentLeft() {
            if ($currentLeft === null) {
                return null;
            }
            return $currentLeft[0].getAttribute("id");
        }
        PageManager.getCurrentLeft = getCurrentLeft;
    })(PageManager = UI.PageManager || (UI.PageManager = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var Loading;
    (function (Loading) {
        var $loadingWindow = $("#loadingWindow").fadeOut(250);
        var loadingCounter = 0;
        Loading.$leftLoader = $("#leftLoading").hide();
        var $rightLoader = $("#rightLoading").hide();
        var leftCounter = 0;
        var rightCounter = 0;
        function stopLoading() {
            if (--loadingCounter <= 0) {
                loadingCounter = 0;
                $loadingWindow.stop().fadeOut(Application.Config.getConfig("animTime").getValue());
            }
        }
        Loading.stopLoading = stopLoading;
        function startLoading() {
            if (++loadingCounter > 0) {
                $loadingWindow.stop().fadeIn(Application.Config.getConfig("animTime").getValue());
            }
        }
        Loading.startLoading = startLoading;
        function blockLeft() {
            if (++leftCounter > 0) {
                Loading.$leftLoader.stop().fadeIn(Application.Config.getConfig("animTime").getValue());
            }
        }
        Loading.blockLeft = blockLeft;
        function blockRight() {
            if (++rightCounter > 0) {
                $rightLoader.stop().fadeIn(Application.Config.getConfig("animTime").getValue());
            }
        }
        Loading.blockRight = blockRight;
        function unblockLeft() {
            if (--leftCounter <= 0) {
                leftCounter = 0;
                Loading.$leftLoader.stop().fadeOut(Application.Config.getConfig("animTime").getValue());
            }
        }
        Loading.unblockLeft = unblockLeft;
        function unblockRight() {
            if (--rightCounter <= 0) {
                rightCounter = 0;
                $rightLoader.stop().fadeOut(Application.Config.getConfig("animTime").getValue());
            }
        }
        Loading.unblockRight = unblockRight;
    })(Loading = UI.Loading || (UI.Loading = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var Login;
    (function (Login) {
        document.getElementById("loginForm").addEventListener("submit", function (e) { UI.Login.submitLogin(e); });
        var inputEmail = document.getElementById("loginEmailInput");
        var inputPassword = document.getElementById("loginPasswordInput");
        function resetState() {
            if (Application.Login.hasLastEmail()) {
                inputEmail.value = Application.Login.getLastEmail();
            }
            else {
                inputEmail.value = "";
            }
            inputPassword.value = "";
        }
        Login.resetState = resetState;
        function resetFocus() {
            if (inputEmail.value !== "") {
                inputPassword.focus();
            }
            else {
                inputEmail.focus();
            }
        }
        Login.resetFocus = resetFocus;
        function assumeEmail(email) {
            inputEmail.value = email;
        }
        Login.assumeEmail = assumeEmail;
        function submitLogin(e) {
            e.preventDefault();
            var cbs = {
                handleEvent: function () {
                    if (Application.Login.isLogged()) {
                        UI.WindowManager.callWindow("mainWindow");
                        UI.Login.resetState();
                    }
                    else {
                        alert("Failed login attempt");
                    }
                }
            };
            var cbe = {
                handleEvent: function () {
                    alert("Failed login attempt");
                }
            };
            Application.Login.attemptLogin(inputEmail.value, inputPassword.value, cbs, cbe);
        }
        Login.submitLogin = submitLogin;
        function exposeLoginFailure(e, statusCode) {
            alert("Invalid Login or Error, status: " + statusCode);
        }
        Login.exposeLoginFailure = exposeLoginFailure;
    })(Login = UI.Login || (UI.Login = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var Handles;
    (function (Handles) {
        var $leftHandle = $("#leftHandleBar");
        var $leftHandleIcon = $("#leftHandleIcon");
        var $rightHandle = $("#rightHandleBar");
        var $rightHandleIcon = $("#rightHandleIcon");
        var alwaysUp = false;
        $leftHandle[0].addEventListener("mouseenter", function (e) { UI.Handles.mouseIn(this); });
        $rightHandle[0].addEventListener("mouseenter", function (e) { UI.Handles.mouseIn(this); });
        $leftHandle[0].addEventListener("mouseleave", function (e) { UI.Handles.mouseOut(this); });
        $rightHandle[0].addEventListener("mouseleave", function (e) { UI.Handles.mouseOut(this); });
        $leftHandle[0].style.left = "-60px";
        $rightHandle[0].style.right = "-60px";
        function isAlwaysUp() {
            return alwaysUp;
        }
        Handles.isAlwaysUp = isAlwaysUp;
        function mouseIn(handle) {
            if (alwaysUp)
                return;
            var left = $leftHandle[0] === handle;
            var css = {};
            css[left ? "left" : "right"] = "0px";
            if (left) {
                $leftHandle.stop().animate(css, Application.Config.getConfig("animTime").getValue() / 2);
            }
            else {
                $rightHandle.stop().animate(css, Application.Config.getConfig("animTime").getValue() / 2);
            }
        }
        Handles.mouseIn = mouseIn;
        function mouseOut(handle) {
            if (alwaysUp)
                return;
            var left = $leftHandle[0] === handle;
            var css = {};
            css[left ? "left" : "right"] = "-60px";
            if (left) {
                $leftHandle.stop().animate(css, Application.Config.getConfig("animTime").getValue() / 2);
            }
            else {
                $rightHandle.stop().animate(css, Application.Config.getConfig("animTime").getValue() / 2);
            }
        }
        Handles.mouseOut = mouseOut;
        function prepareAlwaysUp() {
            $leftHandleIcon[0].style.display = "none";
            $rightHandleIcon[0].style.display = "none";
            $leftHandle[0].style.left = "0px";
            $rightHandle[0].style.right = "0px";
            $leftHandle[0].style.width = "60px";
            $rightHandle[0].style.width = "60px";
        }
        function prepareNotAlwaysUp() {
            $leftHandleIcon[0].style.display = "";
            $rightHandleIcon[0].style.display = "";
            $leftHandle[0].style.left = "-60px";
            $rightHandle[0].style.right = "-60px";
            $leftHandle[0].style.width = "";
            $rightHandle[0].style.width = "";
        }
        function setAlwaysUp(keepUp) {
            if (keepUp === alwaysUp)
                return;
            if (keepUp) {
                alwaysUp = true;
                prepareAlwaysUp();
            }
            else {
                alwaysUp = false;
                prepareNotAlwaysUp();
            }
        }
        Handles.setAlwaysUp = setAlwaysUp;
        $("#logoutButton").on("click", function () { Server.Login.doLogout(); });
    })(Handles = UI.Handles || (UI.Handles = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var Language;
    (function (Language) {
        var currentLanguage = null;
        Application.Config.registerChangeListener("language", {
            handleEvent: function () {
                var oldLanguage = UI.Language.getLanguage();
                UI.Language.searchLanguage();
                var newLanguage = UI.Language.getLanguage();
                if (oldLanguage !== newLanguage) {
                    UI.Language.updateScreen();
                }
            }
        });
        function getLanguage() {
            return currentLanguage;
        }
        Language.getLanguage = getLanguage;
        function searchLanguage() {
            if (Application.Login.isLogged()) {
                var lingid = Application.Config.getConfig("language").getValue();
                currentLanguage = LingoList.getLingo(lingid);
            }
            else {
                if (localStorage.getItem("lastLanguage") !== null) {
                    currentLanguage = LingoList.getLingo(localStorage.getItem("lastLanguage"));
                }
                else {
                    currentLanguage = LingoList.getLingo(navigator.language);
                }
            }
            localStorage.setItem("lastLanguage", currentLanguage.ids[0]);
        }
        Language.searchLanguage = searchLanguage;
        function updateScreen(target) {
            target = target === undefined ? document : target;
            var elements = target.getElementsByClassName("language");
            for (var i = 0; i < elements.length; i++) {
                updateElement(elements[i]);
            }
        }
        Language.updateScreen = updateScreen;
        function updateElement(element) {
            if (element.dataset['languagenodes'] === undefined) {
                processElement(element);
            }
            if (currentLanguage === null)
                return;
            updateText(element);
        }
        Language.updateElement = updateElement;
        function updateText(element) {
            if (currentLanguage === null)
                return;
            if (element.dataset['languagenodes'] !== "" && element.dataset['languagenodes'] !== undefined) {
                var nodes = element.dataset['languagenodes'].split(";");
                var ids = element.dataset['languagevalues'].split(";");
                for (var i = 0; i < nodes.length; i++) {
                    element.childNodes[parseInt(nodes[i])].nodeValue = currentLanguage.getLingo(ids[i], element.dataset);
                }
            }
            if (element.dataset['valuelingo'] !== undefined) {
                updateInput(element);
            }
            if (element.dataset['placeholderlingo'] !== undefined) {
                updatePlaceholder(element);
            }
            if (element.dataset['titlelingo'] !== undefined) {
                updateTitle(element);
            }
        }
        Language.updateText = updateText;
        function updatePlaceholder(element) {
            element.placeholder = currentLanguage.getLingo(element.dataset['placeholderlingo'], element.dataset);
        }
        function updateInput(element) {
            element.value = currentLanguage.getLingo(element.dataset['valuelingo'], element.dataset);
        }
        function updateTitle(element) {
            element.setAttribute("title", currentLanguage.getLingo(element.dataset['titlelingo'], element.dataset));
        }
        function processElement(element) {
            var ele;
            var languageNodes = [];
            var languageValues = [];
            for (var i = 0; i < element.childNodes.length; i++) {
                ele = element.childNodes[i];
                if (ele.nodeType === Node.TEXT_NODE) {
                    var text = ele.nodeValue.trim();
                    if (text.charAt(0) === "_") {
                        languageNodes.push(i.toString());
                        languageValues.push(text);
                    }
                }
            }
            element.dataset['languagenodes'] = languageNodes.join(";");
            element.dataset['languagevalues'] = languageValues.join(";");
        }
        function addLanguageVariable(element, id, value) {
            element.dataset['language' + id] = value;
        }
        Language.addLanguageVariable = addLanguageVariable;
        function addLanguageValue(element, value) {
            element.dataset['valuelingo'] = value;
        }
        Language.addLanguageValue = addLanguageValue;
        function addLanguagePlaceholder(element, value) {
            element.dataset['placeholderlingo'] = value;
        }
        Language.addLanguagePlaceholder = addLanguagePlaceholder;
        function addLanguageTitle(element, value) {
            element.dataset['titlelingo'] = value;
        }
        Language.addLanguageTitle = addLanguageTitle;
        function markLanguage(element) {
            element.classList.add("language");
            processElement(element);
            updateText(element);
        }
        Language.markLanguage = markLanguage;
    })(Language = UI.Language || (UI.Language = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var Games;
    (function (Games) {
        var gameListTarget = document.getElementById("gameListTarget");
        var nickTarget = document.getElementById("gamesNickTarget");
        Application.Login.addListener({
            handleEvent: function (isLogged) {
                UI.Games.updateNick(isLogged);
            }
        });
        document.getElementById("gamesButton").addEventListener("click", function () {
            UI.Games.callSelf();
        });
        function callSelf(ready) {
            UI.PageManager.callPage(UI.idGames);
            if (ready !== true) {
                Server.Games.updateLists({
                    handleEvent: function () {
                        UI.Games.callSelf(true);
                    }
                });
                return;
            }
            var games = DB.GameDB.getOrderedGameList();
            while (gameListTarget.lastChild !== null)
                gameListTarget.removeChild(gameListTarget.lastChild);
            for (var i = 0; i < games.length; i++) {
                var div = document.createElement("div");
                var p = document.createElement("p");
                p.classList.add("mainWindowParagraph");
                p.classList.add("hoverable");
                p.appendChild(document.createTextNode(games[i].name));
                var roomList = games[i].getOrderedRoomList();
                for (var k = 0; k < roomList.length; k++) {
                    p.appendChild(document.createElement("br"));
                    var a = document.createElement("a");
                    a.classList.add("textLink");
                    a.appendChild(document.createTextNode(roomList[k].name));
                    a.addEventListener('click', {
                        roomid: roomList[k].id,
                        handleEvent: function () {
                            UI.Chat.callSelf(this.roomid);
                        }
                    });
                    p.appendChild(a);
                }
                div.appendChild(p);
                gameListTarget.appendChild(div);
            }
        }
        Games.callSelf = callSelf;
        ;
        function updateNick(isLogged) {
            if (!isLogged) {
                nickTarget.dataset['languagea'] = "Logged out";
            }
            else {
                nickTarget.dataset['languagea'] = Application.Login.getUser().getFullNickname();
            }
            UI.Language.updateText(nickTarget);
        }
        Games.updateNick = updateNick;
        ;
    })(Games = UI.Games || (UI.Games = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var SoundController;
    (function (SoundController) {
        var diceSound = document.getElementById("soundDiceRoll");
        var alertSound = document.getElementById("soundAlert");
        var bgmSound = document.getElementById("soundPlayerBGM");
        var seSound = document.getElementById("soundPlayerSE");
        var soundList = document.getElementById("chatSounds");
        var lastURL = null;
        var lastSEURL = null;
        var startedPlaying = false;
        diceSound.parentNode.removeChild(diceSound);
        alertSound.parentNode.removeChild(alertSound);
        bgmSound.parentNode.removeChild(bgmSound);
        seSound.parentNode.removeChild(seSound);
        Application.Config.getConfig("seVolume").addChangeListener(new SimpleListener(function (e) { UI.SoundController.updateSEVolume(e.getValue()); }));
        Application.Config.getConfig("bgmVolume").addChangeListener(new SimpleListener(function (e) { UI.SoundController.updateBGMVolume(e.getValue()); }));
        function updateSEVolume(newVolume) {
            var volume;
            if (newVolume > 100) {
                volume = 1;
            }
            else if (newVolume < 0) {
                volume = 0;
            }
            else {
                volume = (newVolume / 100);
            }
            diceSound.volume = volume;
            alertSound.volume = volume;
            seSound.volume = volume;
        }
        SoundController.updateSEVolume = updateSEVolume;
        function updateBGMVolume(newVolume) {
            var volume;
            if (newVolume > 100) {
                volume = 1;
            }
            else if (newVolume < 0) {
                volume = 0;
            }
            else {
                volume = (newVolume / 100);
            }
            bgmSound.volume = volume;
        }
        SoundController.updateBGMVolume = updateBGMVolume;
        bgmSound.addEventListener("error", function (e) {
            var msg = new ChatSystemMessage(true);
            msg.addText("_CHATBGMERROR_");
            msg.addText(" ");
            var list = new SimpleListener(function () {
                this.soundList.click();
            });
            list.setValue("soundList", soundList);
            msg.addTextLink("_CHATSOUNDADDMORE_", true, list);
            UI.Chat.printElement(msg.getElement());
        });
        seSound.addEventListener("error", function () {
            var msg = new ChatSystemMessage(true);
            msg.addText("_CHATSEERROR_");
            msg.addText(" ");
            var list = new SimpleListener(function () {
                this.soundList.click();
            });
            list.setValue("soundList", soundList);
            msg.addTextLink("_CHATSOUNDADDMORE_", true, list);
            UI.Chat.printElement(msg.getElement());
        });
        function getBGM() {
            return bgmSound;
        }
        SoundController.getBGM = getBGM;
        function playDice() {
            diceSound.currentTime = 0;
            diceSound.play();
        }
        SoundController.playDice = playDice;
        function playAlert() {
            alertSound.currentTime = 0;
            alertSound.play();
        }
        SoundController.playAlert = playAlert;
        bgmSound.addEventListener("canplay", function () {
            if (UI.SoundController.isAutoPlay()) {
                this.play();
            }
        });
        seSound.addEventListener("canplay", function () {
            this.play();
        });
        function isAutoPlay() {
            var r = startedPlaying;
            startedPlaying = false;
            return r;
        }
        SoundController.isAutoPlay = isAutoPlay;
        function playBGM(url) {
            if (lastURL !== null) {
                URL.revokeObjectURL(lastURL);
                lastURL = null;
            }
            startedPlaying = true;
            var found = false;
            var isLink = url.indexOf("://") !== -1;
            if (!isLink) {
                for (var id in soundList.files) {
                    if (soundList.files[id].name === url) {
                        url = URL.createObjectURL(soundList.files[id]);
                        lastURL = url;
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                if (!isLink) {
                    url = "Sounds/" + url;
                }
                else {
                    url = Server.URL.fixURL(url);
                }
            }
            bgmSound.src = url;
        }
        SoundController.playBGM = playBGM;
        function playSE(url) {
            if (lastSEURL !== null) {
                URL.revokeObjectURL(lastSEURL);
                lastSEURL = null;
            }
            var found = false;
            var isLink = url.indexOf("://") !== -1;
            if (!isLink) {
                for (var id in soundList.files) {
                    if (soundList.files[id].name === url) {
                        url = URL.createObjectURL(soundList.files[id]);
                        lastSEURL = url;
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                if (!isLink) {
                    url = "Sounds/" + url;
                }
                else {
                    url = Server.URL.fixURL(url);
                }
            }
            seSound.src = url;
        }
        SoundController.playSE = playSE;
    })(SoundController = UI.SoundController || (UI.SoundController = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var SoundController;
    (function (SoundController) {
        var MusicPlayer;
        (function (MusicPlayer) {
            var bgm = UI.SoundController.getBGM();
            var button = document.getElementById("musicPlayerButton");
            var parent = button.parentNode;
            var container = document.getElementById("musicPlayerContainer");
            var bar = document.getElementById("musicPlayerProgress");
            var playpause = document.getElementById("musicPlayerPlayPause");
            var stop = document.getElementById("musicPlayerStop");
            var repeat = document.getElementById("musicPlayerRepeat");
            parent.removeChild(button);
            button.removeChild(container);
            playpause.addEventListener("click", function () {
                var bgm = UI.SoundController.getBGM();
                if (bgm.paused) {
                    bgm.play();
                    this.classList.add("icons-soundPlayerPause");
                    this.classList.remove("icons-soundPlayerPlay");
                }
                else {
                    bgm.pause();
                    this.classList.remove("icons-soundPlayerPause");
                    this.classList.add("icons-soundPlayerPlay");
                }
            });
            stop.addEventListener("click", function () { UI.SoundController.MusicPlayer.stopPlaying(); });
            repeat.addEventListener("click", function () {
                var cfg = Application.Config.getConfig("bgmLoop");
                cfg.storeValue(!cfg.getValue());
            });
            Application.Config.getConfig("bgmLoop").addChangeListener({
                repeat: repeat,
                handleEvent: function (e) {
                    if (e.getValue()) {
                        this.repeat.classList.add("icons-soundPlayerRepeatActive");
                        this.repeat.classList.remove("icons-soundPlayerRepeat");
                    }
                    else {
                        this.repeat.classList.add("icons-soundPlayerRepeat");
                        this.repeat.classList.remove("icons-soundPlayerRepeatActive");
                    }
                }
            });
            bgm.addEventListener("error", function () {
                UI.SoundController.MusicPlayer.stopPlaying();
            });
            bgm.addEventListener("play", {
                playpause: playpause,
                handleEvent: function () {
                    this.playpause.classList.add("icons-soundPlayerPause");
                    this.playpause.classList.remove("icons-soundPlayerPlay");
                }
            });
            bgm.addEventListener("play", function () { UI.SoundController.MusicPlayer.showButton(); });
            var updateSeekerF = function () {
                var time = this.currentTime;
                var duration = this.duration;
                UI.SoundController.MusicPlayer.updateSeeker((time / duration) * 100);
            };
            bgm.addEventListener("timeupdate", updateSeekerF);
            bgm.addEventListener("durationchange", updateSeekerF);
            delete (updateSeekerF);
            bgm.addEventListener("ended", function () {
                var loop = Application.Config.getConfig("bgmLoop").getValue();
                if (loop) {
                    this.currentTime = 0;
                    this.play();
                }
                else {
                    UI.SoundController.MusicPlayer.stopPlaying();
                }
            });
            bar.addEventListener("click", function (e) {
                var offset = $(this).offset();
                var x = e.pageX - offset.left;
                var width = this.clientWidth;
                var bgm = UI.SoundController.getBGM();
                bgm.currentTime = bgm.duration * (x / width);
            });
            button.addEventListener("mouseover", function () { UI.SoundController.MusicPlayer.showContainer(); });
            button.addEventListener("mouseout", function (event) {
                var e = (event.toElement || event.relatedTarget);
                var parent = e;
                while (parent !== null) {
                    if (parent === this) {
                        break;
                    }
                    parent = parent.parentNode;
                }
                if (parent !== null) {
                    return;
                }
                UI.SoundController.MusicPlayer.hideContainer();
            });
            function showContainer() {
                button.appendChild(container);
            }
            MusicPlayer.showContainer = showContainer;
            function hideContainer() {
                button.removeChild(container);
            }
            MusicPlayer.hideContainer = hideContainer;
            function showButton() {
                parent.appendChild(button);
            }
            MusicPlayer.showButton = showButton;
            function hideButton() {
                if (button.parentNode === parent)
                    parent.removeChild(button);
            }
            MusicPlayer.hideButton = hideButton;
            function updateSeeker(perc) {
                bar.value = perc;
            }
            MusicPlayer.updateSeeker = updateSeeker;
            function stopPlaying() {
                hideButton();
                bgm.pause();
                bgm.currentTime = 0;
            }
            MusicPlayer.stopPlaying = stopPlaying;
        })(MusicPlayer = SoundController.MusicPlayer || (SoundController.MusicPlayer = {}));
    })(SoundController = UI.SoundController || (UI.SoundController = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var Chat;
    (function (Chat) {
        var chatBox = document.getElementById("chatBox");
        var $chatBox = $(chatBox);
        var $chatBoxScrollDown = $("#chatScrollDown");
        $chatBoxScrollDown[0].style.display = "none";
        var chatHelperss = document.getElementsByClassName("chatInitHelp");
        var chatHelpers = [];
        for (var i = 0; i < chatHelperss.length; i++) {
            chatHelpers.push(chatHelperss[i]);
        }
        delete (i, chatHelperss);
        Application.Config.getConfig("chatfontsize").addChangeListener({
            chatBox: chatBox,
            handleEvent: function () {
                this.chatBox.style.fontSize = Application.Config.getConfig("chatfontsize").getValue() + "px";
                UI.Chat.updateScrollPosition(true);
            }
        });
        chatBox.style.fontSize = Application.Config.getConfig("chatfontsize").getValue() + "px";
        Application.Config.getConfig("chatfontfamily").addChangeListener({
            chatBox: chatBox,
            handleEvent: function () {
                this.chatBox.style.fontFamily = Application.Config.getConfig("chatfontfamily").getValue();
            }
        });
        chatBox.style.fontFamily = Application.Config.getConfig("chatfontfamily").getValue();
        Application.Config.getConfig("chatshowhelp").addChangeListener({
            chatHelpers: chatHelpers,
            handleEvent: function (e) {
                for (var i = 0; i < this.chatHelpers.length; i++) {
                    this.chatHelpers[i].style.display = e.getValue() ? "" : "none";
                }
            }
        });
        var chatTitleNode = document.createTextNode("Title");
        var chatDescriptionNode = document.createTextNode("Description");
        document.getElementById("chatTitle").appendChild(chatTitleNode);
        document.getElementById("chatDescription").appendChild(chatDescriptionNode);
        var chatInfoFloater = new ChatInfo(document.getElementById("chatFloater"));
        var chatTarget = document.getElementById("chatMessages");
        var printingMany = false;
        var lastPrintedId = 0;
        var scrolledDown = true;
        var currentRoom = null;
        var roomListeners = [];
        Chat.messageCounter = 0;
        function doAutomation() {
            return !printingMany;
        }
        Chat.doAutomation = doAutomation;
        function callSelf(roomid) {
            UI.PageManager.callPage(UI.idChat);
            clearRoom();
            Server.Chat.enterRoom(roomid);
            var room = DB.RoomDB.getRoom(roomid);
            chatTitleNode.nodeValue = room.name;
            chatDescriptionNode.nodeValue = room.description;
            currentRoom = room;
            triggerRoomChanged();
        }
        Chat.callSelf = callSelf;
        function addRoomChangedListener(listener) {
            roomListeners.push(listener);
        }
        Chat.addRoomChangedListener = addRoomChangedListener;
        function triggerRoomChanged() {
            for (var i = 0; i < roomListeners.length; i++) {
                roomListeners[i].handleEvent(currentRoom);
            }
        }
        function getRoom() {
            return currentRoom;
        }
        Chat.getRoom = getRoom;
        function clearRoom() {
            var parent = chatTarget.parentNode;
            parent.removeChild(chatTarget);
            while (chatTarget.lastChild !== null) {
                chatTarget.removeChild(chatTarget.lastChild);
            }
            parent.appendChild(chatTarget);
            lastPrintedId = 0;
            Chat.messageCounter = 0;
        }
        Chat.clearRoom = clearRoom;
        function printElement(element, doScroll) {
            chatTarget.appendChild(element);
            Chat.messageCounter++;
            if (doScroll === undefined || doScroll) {
                updateScrollPosition();
            }
            var maxMessages = $.browser.mobile ? Application.Config.getConfig("chatMaxMessages").getDefault() : Application.Config.getConfig("chatMaxMessages").getValue();
            if (Chat.messageCounter > maxMessages) {
                Chat.messageCounter = chatTarget.children.length;
                while (Chat.messageCounter > (maxMessages / 2)) {
                    Chat.messageCounter--;
                    chatTarget.removeChild(chatTarget.firstChild);
                }
                printGetAllButtonAtStart();
            }
        }
        Chat.printElement = printElement;
        function printMessage(message, doScroll) {
            var element = message.getHTML();
            if (element !== null) {
                chatInfoFloater.bindMessage(message, element);
                printElement(element);
            }
            if (message.id > lastPrintedId) {
                lastPrintedId = message.id;
            }
            message.onPrint();
            if (doScroll === undefined || doScroll) {
                updateScrollPosition();
            }
        }
        Chat.printMessage = printMessage;
        function printMessages(messages, ignoreLowIds) {
            printingMany = true;
            var maxMessages = $.browser.mobile ? Application.Config.getConfig("chatMaxMessages").getDefault() : Application.Config.getConfig("chatMaxMessages").getValue();
            var i;
            var counting = 0;
            for (i = messages.length - 1; i >= 0; i--) {
                if (messages[i].getHTML() !== null) {
                    if (++counting > (maxMessages - 2)) {
                        break;
                    }
                }
            }
            if (i >= 0) {
                clearRoom();
            }
            else {
                i = 0;
            }
            if (i > 0) {
                var msg = new ChatSystemMessage(true);
                msg.addText("_CHATNOTALLMESSAGES_");
                printElement(msg.getElement());
            }
            var parent = chatTarget.parentNode;
            parent.removeChild(chatTarget);
            while (i < messages.length) {
                if (!messages[i].doNotPrint() && (ignoreLowIds || messages[i].id > lastPrintedId)) {
                    printMessage(messages[i], false);
                }
                i++;
            }
            parent.appendChild(chatTarget);
            printingMany = false;
            updateScrollPosition();
        }
        Chat.printMessages = printMessages;
        function updateScrollPosition(instant) {
            instant = instant === undefined ? true : instant;
            if (scrolledDown) {
                if (instant)
                    chatBox.scrollTop = chatBox.scrollHeight - chatBox.offsetHeight + 10;
                else
                    $chatBox.stop().animate({
                        scrollTop: chatBox.scrollHeight - chatBox.offsetHeight + 10
                    }, Application.Config.getConfig("animTime").getValue());
            }
        }
        Chat.updateScrollPosition = updateScrollPosition;
        function setScrolledDown(state) {
            if (scrolledDown === state)
                return;
            scrolledDown = state;
            if (scrolledDown) {
                $chatBoxScrollDown.stop().fadeOut(Application.Config.getConfig("animTime").getValue());
            }
            else {
                $chatBoxScrollDown.stop().fadeIn(Application.Config.getConfig("animTime").getValue());
            }
        }
        Chat.setScrolledDown = setScrolledDown;
        function sendMessage(message) {
            if (currentRoom === null) {
                console.warn("[CHAT] Attempt to send messages while not in a room. Ignoring. Offending message:", message);
                return;
            }
            message.roomid = currentRoom.id;
            message.prepareSending();
            printMessage(message);
            Server.Chat.sendMessage(message);
        }
        Chat.sendMessage = sendMessage;
        function getGetAllButton() {
            var getAllForMe = {
                room: currentRoom,
                handleEvent: function () {
                    var cbs = {
                        handleEvent: function () {
                            UI.Chat.clearRoom();
                            UI.Chat.printMessages(UI.Chat.getRoom().getOrderedMessages(), false);
                        }
                    };
                    Server.Chat.getAllMessages(this.room.id, cbs);
                }
            };
            var getAllForMeText = new ChatSystemMessage(true);
            getAllForMeText.addText("_CHATOLDMESSAGESNOTLOADED_");
            getAllForMeText.addText(" ");
            getAllForMeText.addTextLink("_CHATOLDMESSAGESLOAD_", true, getAllForMe);
            return getAllForMeText.getElement();
        }
        Chat.getGetAllButton = getGetAllButton;
        function printGetAllButtonAtStart() {
            if (chatTarget.firstChild !== null) {
                var html = getGetAllButton();
                chatTarget.insertBefore(html, chatTarget.firstChild);
            }
            else {
                printGetAllButton();
            }
        }
        Chat.printGetAllButtonAtStart = printGetAllButtonAtStart;
        function printGetAllButton() {
            printElement(getGetAllButton());
        }
        Chat.printGetAllButton = printGetAllButton;
        chatBox.addEventListener("scroll", function (a) {
            var minScroll = this.scrollHeight - this.offsetHeight - 10;
            var currentScroll = this.scrollTop;
            UI.Chat.setScrolledDown(currentScroll >= minScroll);
        });
        $chatBoxScrollDown[0].addEventListener("click", function () {
            UI.Chat.setScrolledDown(true);
            UI.Chat.updateScrollPosition(false);
        });
        clearRoom();
        for (var i = 0; i < 1; i++) {
            var messages = MessageFactory.createTestingMessages();
            printMessages(messages, true);
            delete (messages);
            DB.MessageDB.releaseAllLocalMessages();
        }
        delete (i);
    })(Chat = UI.Chat || (UI.Chat = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var Chat;
    (function (Chat) {
        var Avatar;
        (function (Avatar) {
            var avatarBox = document.getElementById("avatarBox");
            var $avatarBox = $(avatarBox);
            while (avatarBox.firstChild !== null)
                avatarBox.removeChild(avatarBox.firstChild);
            var height = 80;
            var upButton = document.getElementById("avatarUpButton");
            upButton.addEventListener("click", function () { UI.Chat.Avatar.moveScroll(-1); });
            var downButton = document.getElementById("avatarDownButton");
            downButton.addEventListener("click", function () { UI.Chat.Avatar.moveScroll(1); });
            var avatars = {};
            function getMe() {
                return avatars[Application.Login.getUser().id];
            }
            Avatar.getMe = getMe;
            function resetForConnect() {
                for (var id in avatars) {
                    avatars[id].reset();
                }
            }
            Avatar.resetForConnect = resetForConnect;
            function moveScroll(direction) {
                $avatarBox.finish();
                var currentHeight = avatarBox.scrollHeight;
                var currentScroll = avatarBox.scrollTop;
                var change = direction * height;
                if ((currentScroll + change) <= 0) {
                    upButton.classList.add("inactive");
                }
                else {
                    upButton.classList.remove("inactive");
                }
                if ((currentScroll + height + change) >= currentHeight) {
                    downButton.classList.add("inactive");
                }
                else {
                    downButton.classList.remove("inactive");
                }
                $avatarBox.animate({
                    scrollTop: (currentScroll + change) + "px"
                });
            }
            Avatar.moveScroll = moveScroll;
            function updatePosition() {
                var currentHeight = avatarBox.scrollHeight;
                var currentScroll = avatarBox.scrollTop;
                if (currentHeight <= height) {
                    avatarBox.scrollTop = 0;
                }
                else if (currentHeight <= (currentScroll + height)) {
                    avatarBox.scrollTop = currentHeight - height;
                }
                if (avatarBox.scrollTop === 0) {
                    upButton.classList.add("inactive");
                }
                else {
                    upButton.classList.remove("inactive");
                }
                if ((avatarBox.scrollTop + height) === currentHeight) {
                    downButton.classList.add("inactive");
                }
                else {
                    downButton.classList.remove("inactive");
                }
            }
            Avatar.updatePosition = updatePosition;
            function updateFromObject(obj, cleanup) {
                var cleanedup = [];
                for (var i = 0; i < obj.length; i++) {
                    if (avatars[obj[i]['id']] === undefined) {
                        avatars[obj[i]['id']] = new ChatAvatar();
                        avatarBox.appendChild(avatars[obj[i]['id']].getHTML());
                    }
                    avatars[obj[i]['id']].updateFromObject(obj[i]);
                    if (avatars[obj[i]['id']].isChangedOnline()) {
                        var msg = new ChatSystemMessage(true);
                        msg.addText(avatars[obj[i]['id']].getUser().getFullNickname() + " ");
                        if (avatars[obj[i]['id']].online) {
                            msg.addText("_CHATHASCONNECTED_");
                        }
                        else {
                            msg.addText("_CHATHASDISCONNECTED_");
                        }
                        UI.Chat.printElement(msg.getElement(), false);
                    }
                    cleanedup.push(obj[i]['id'].toString());
                }
                UI.Chat.updateScrollPosition(true);
                if (cleanup) {
                    for (var id in avatars) {
                        if (cleanedup.indexOf(id.toString()) === -1) {
                            avatarBox.removeChild(avatars[id].getHTML());
                            delete (avatars[id]);
                        }
                    }
                }
                updatePosition();
            }
            Avatar.updateFromObject = updateFromObject;
        })(Avatar = Chat.Avatar || (Chat.Avatar = {}));
    })(Chat = UI.Chat || (UI.Chat = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var Chat;
    (function (Chat) {
        var Forms;
        (function (Forms) {
            var formState = new ChatFormState(document.getElementById("chatMessageStateIcon"));
            var formInput = document.getElementById("chatMessageInput");
            var diceTower = document.getElementById("chatDiceTower");
            diceTower.addEventListener("click", function () {
                if (this.classList.contains("icons-chatDiceTowerOn")) {
                    this.classList.remove("icons-chatDiceTowerOn");
                    this.classList.add("icons-chatDiceTower");
                }
                else {
                    this.classList.add("icons-chatDiceTowerOn");
                    this.classList.remove("icons-chatDiceTower");
                }
            });
            var diceForm = document.getElementById("diceFormBox");
            diceForm.addEventListener("submit", function (e) {
                UI.Chat.Forms.rollDice();
                e.preventDefault();
            });
            var diceAmount = document.getElementById("chatDiceAmount");
            var diceFaces = document.getElementById("chatDiceFaces");
            var diceMod = document.getElementById("chatDiceMod");
            var diceReason = document.getElementById("chatDiceReason");
            document.getElementById("chatMessageSendButton");
            var typing = false;
            var afk = false;
            var focused = true;
            var inputKeyHandler = function (e) { UI.Chat.Forms.handleInputKeyboard(e); };
            formInput.addEventListener("keyup", inputKeyHandler);
            formInput.addEventListener("keydown", inputKeyHandler);
            formInput.addEventListener("keydown", function (e) { UI.Chat.Forms.handleInputKeypress(e); });
            delete (inputKeyHandler);
            var lastWhisperFrom = null;
            addOnReady("ChatForms", "Dependency to same-level Module (UI.Chat.PersonaManager)", {
                handleEvent: function () {
                    UI.Chat.PersonaManager.addListener({
                        handleEvent: function (name, avatar) {
                            UI.Chat.Forms.updateFormState(name !== null);
                        }
                    });
                }
            });
            var olderTexts = [];
            var oldTextPosition = -1;
            function addOlderText() {
                var trimmed = formInput.value.trim();
                if (trimmed !== "") {
                    oldTextPosition = olderTexts.push(trimmed);
                }
            }
            Forms.addOlderText = addOlderText;
            function moveOlderText(direction) {
                if (oldTextPosition === olderTexts.length) {
                    var oldPos = oldTextPosition;
                    addOlderText();
                    oldTextPosition = oldPos;
                }
                oldTextPosition += direction;
                if (oldTextPosition < 0) {
                    oldTextPosition = 0;
                    if (olderTexts.length > 0)
                        formInput.value = olderTexts[oldTextPosition];
                }
                else if (oldTextPosition >= olderTexts.length) {
                    oldTextPosition = olderTexts.length;
                    formInput.value = "";
                }
                else {
                    formInput.value = olderTexts[oldTextPosition];
                }
            }
            Forms.moveOlderText = moveOlderText;
            function updateFormState(hasPersona) {
                if (hasPersona) {
                    formState.setState(ChatFormState.STATE_NORMAL);
                }
                else {
                    var room = UI.Chat.getRoom();
                    if (room !== null && room.getMe().isStoryteller()) {
                        formState.setState(ChatFormState.STATE_STORY);
                    }
                    else {
                        formState.setState(ChatFormState.STATE_OFF);
                    }
                }
            }
            Forms.updateFormState = updateFormState;
            function handleInputKeyboard(e) {
                setTyping(formInput.value !== "");
                if (e.shiftKey) {
                    formState.setState(ChatFormState.STATE_STORY);
                }
                else if (e.ctrlKey) {
                    if (UI.Chat.PersonaManager.getPersonaName() !== null) {
                        formState.setState(ChatFormState.STATE_ACTION);
                    }
                    else {
                        var room = UI.Chat.getRoom();
                        if (room !== null && room.getMe().isStoryteller()) {
                            formState.setState(ChatFormState.STATE_STORY);
                        }
                        else {
                            formState.setState(ChatFormState.STATE_OFF);
                        }
                    }
                }
                else if (e.altKey) {
                    formState.setState(ChatFormState.STATE_OFF);
                }
                else {
                    if (UI.Chat.PersonaManager.getPersonaName() !== null) {
                        formState.setState(ChatFormState.STATE_NORMAL);
                    }
                    else {
                        var room = UI.Chat.getRoom();
                        if (room !== null && room.getMe().isStoryteller()) {
                            formState.setState(ChatFormState.STATE_STORY);
                        }
                        else {
                            formState.setState(ChatFormState.STATE_OFF);
                        }
                    }
                }
                if (e.keyCode === 18) {
                    e.preventDefault();
                }
            }
            Forms.handleInputKeyboard = handleInputKeyboard;
            function handleInputKeypress(e) {
                if (e.keyCode === 9) {
                    if (formInput.value === "") {
                        if (e.shiftKey) {
                            diceReason.focus();
                        }
                        else {
                            diceAmount.focus();
                        }
                    }
                    e.preventDefault();
                }
                if (e.keyCode === 10 || e.keyCode === 13) {
                    UI.Chat.Forms.sendMessage();
                    e.preventDefault();
                    return;
                }
                if (e.keyCode === 38) {
                    UI.Chat.Forms.moveOlderText(-1);
                    e.preventDefault();
                    return;
                }
                if (e.keyCode === 40) {
                    UI.Chat.Forms.moveOlderText(1);
                    e.preventDefault();
                    return;
                }
                if (e.keyCode === 27) {
                    e.preventDefault();
                    return;
                }
                var trimmed = formInput.value.trim();
                if (e.keyCode === 9) {
                    if (MessageFactory.getConstructorFromText(trimmed) === MessageWhisper) {
                        var room = UI.Chat.getRoom();
                        if (room !== null) {
                            var index = trimmed.indexOf(',');
                            var index2 = trimmed.indexOf(" ");
                            if (index2 === -1) {
                                var target = "";
                                var message = "";
                            }
                            else {
                                if (index !== -1) {
                                    var target = trimmed.substr(index2 + 1, (index - index2 - 1)).trim();
                                    var message = trimmed.substr(index + 1).trim();
                                }
                                else {
                                    var target = trimmed.substr(index2 + 1).trim();
                                    var message = "";
                                }
                            }
                            var users = room.getUsersByName(target);
                            if (users.length === 1) {
                                setInput("/whisper " + users[0].getUniqueNickname() + ", " + message);
                            }
                            else {
                                var error = new ChatSystemMessage(true);
                                if (users.length === 0) {
                                    error.addText("_CHATWHISPERNOTARGETSFOUND_");
                                    error.addLangVar("a", target);
                                }
                                else {
                                    var clickF = function () {
                                        UI.Chat.Forms.setInput("/whisper " + this.target + ", " + this.message);
                                    };
                                    error.addText("_CHATMULTIPLETARGETSFOUND_");
                                    error.addText(": ");
                                    for (var i = 0; i < users.length; i++) {
                                        var listener = new SimpleListener(clickF);
                                        listener.setValue("target", users[i].getUniqueNickname());
                                        listener.setValue("message", message);
                                        error.addTextLink(users[i].getUniqueNickname(), false, listener);
                                        if ((i + 1) < users.length) {
                                            error.addText(", ");
                                        }
                                        else {
                                            error.addText(".");
                                        }
                                    }
                                }
                                UI.Chat.printElement(error.getElement());
                            }
                        }
                    }
                }
                if (e.keyCode === 9 || e.keyCode === 32) {
                    if (lastWhisperFrom !== null && MessageFactory.getConstructorFromText(trimmed) === SlashReply) {
                        setInput("/whisper " + lastWhisperFrom.getUniqueNickname() + ", ");
                    }
                }
            }
            Forms.handleInputKeypress = handleInputKeypress;
            function sendMessage() {
                var trimmed = formInput.value.trim();
                if (trimmed === "") {
                    var emptyMessage = new ChatSystemMessage(true);
                    emptyMessage.addText("_CHATEMPTYNOTALLOWED_");
                    UI.Chat.printElement(emptyMessage.getElement(), true);
                }
                else {
                    addOlderText();
                    var message = null;
                    if (trimmed.charAt(0) === "/") {
                        message = MessageFactory.createFromText(trimmed);
                    }
                    else {
                        if (formState.isNormal()) {
                            message = new MessageRoleplay();
                            message.receiveCommand("", trimmed);
                        }
                        else if (formState.isStory()) {
                            message = new MessageStory();
                            message.receiveCommand("/story", trimmed);
                        }
                        else if (formState.isAction()) {
                            message = new MessageAction();
                            message.receiveCommand("/me", trimmed);
                        }
                        else if (formState.isOff()) {
                            message = new MessageOff();
                            message.receiveCommand("/off", trimmed);
                        }
                    }
                    if (message !== null) {
                        message.findPersona();
                        UI.Chat.sendMessage(message);
                    }
                    formInput.value = "";
                }
            }
            Forms.sendMessage = sendMessage;
            function isTyping() {
                return typing;
            }
            Forms.isTyping = isTyping;
            function isFocused() {
                return focused;
            }
            Forms.isFocused = isFocused;
            function isAfk() {
                return afk;
            }
            Forms.isAfk = isAfk;
            function setTyping(newTyping) {
                if (typing !== newTyping) {
                    typing = newTyping;
                    sendStatus();
                }
            }
            Forms.setTyping = setTyping;
            function setFocused(newFocused) {
                if (focused !== newFocused) {
                    focused = newFocused;
                    sendStatus();
                }
            }
            Forms.setFocused = setFocused;
            function setAfk(newAfk) {
                if (afk !== newAfk) {
                    afk = newAfk;
                    sendStatus();
                }
            }
            Forms.setAfk = setAfk;
            function sendStatus() {
                Server.Chat.sendStatus({
                    afk: afk,
                    focused: focused,
                    typing: typing,
                    avatar: null,
                    persona: null
                });
            }
            function considerRedirecting(event) {
                if ((!event.ctrlKey && !event.altKey) || (event.ctrlKey && event.keyCode === 86)) {
                    if (UI.PageManager.getCurrentLeft() === UI.idChat) {
                        var focus = document.activeElement;
                        var focusTag = focus.tagName.toLowerCase();
                        if (focusTag !== "input" && focusTag !== "textarea" && focusTag !== "select") {
                            formInput.focus();
                        }
                    }
                }
            }
            Forms.considerRedirecting = considerRedirecting;
            function rollDice(faces) {
                var amount = parseInt(diceAmount.value);
                faces = faces === undefined ? parseInt(diceFaces.value) : faces;
                var mod = parseInt(diceMod.value);
                var reason = diceReason.value.trim();
                if (isNaN(amount))
                    amount = 1;
                if (isNaN(faces))
                    faces = 6;
                if (isNaN(mod))
                    mod = 0;
                var dice = new MessageDice();
                dice.findPersona();
                dice.setMsg(reason);
                dice.setMod(mod);
                dice.addDice(amount, faces);
                if (diceTower.classList.contains("icons-chatDiceTowerOn")) {
                    dice.addDestinationStorytellers(UI.Chat.getRoom());
                }
                UI.Chat.sendMessage(dice);
                diceReason.value = "";
            }
            Forms.rollDice = rollDice;
            function setInput(str) {
                formInput.value = str;
                formInput.focus();
            }
            Forms.setInput = setInput;
            function setLastWhisperFrom(user) {
                lastWhisperFrom = user;
            }
            Forms.setLastWhisperFrom = setLastWhisperFrom;
            document.addEventListener("keypress", function (e) {
                UI.Chat.Forms.considerRedirecting(e);
            });
            document.addEventListener("keydown", function (e) {
                if (e.ctrlKey && e.keyCode === 86) {
                    UI.Chat.Forms.considerRedirecting(e);
                }
            });
            document.addEventListener("keydown", function (e) {
                if (e.which === 8 && !$(e.target).is("input, textarea")) {
                    e.preventDefault();
                }
            });
            window.addEventListener("focus", function () { UI.Chat.Forms.setFocused(true); });
            window.addEventListener("blur", function () { UI.Chat.Forms.setFocused(false); });
            $(window).idle({
                onIdle: function () {
                    UI.Chat.Forms.setAfk(true);
                },
                onActive: function () {
                    UI.Chat.Forms.setAfk(false);
                },
                events: "mouseover mouseout click keypress mousedown mousemove blur focus",
                idle: 30000
            });
            var dices = [4, 6, 8, 10, 12, 20, 100];
            for (var i = 0; i < dices.length; i++) {
                document.getElementById("chatDiceD" + dices[i]).addEventListener("click", {
                    dice: dices[i],
                    handleEvent: function () {
                        UI.Chat.Forms.rollDice(this.dice);
                    }
                });
            }
            delete (dices, i);
        })(Forms = Chat.Forms || (Chat.Forms = {}));
    })(Chat = UI.Chat || (UI.Chat = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var Chat;
    (function (Chat) {
        var Notification;
        (function (Notification) {
            var bar = document.getElementById("chatNotificationBar");
            while (bar.firstChild !== null)
                bar.removeChild(bar.firstChild);
            var reconnecting = new ChatNotificationIcon("icons-chatNotReconnecting", false);
            bar.appendChild(reconnecting.getElement());
            var disconnected = new ChatNotificationIcon("icons-chatNotDisconnected", true);
            disconnected.addText("_CHATDISCONNECTEDEXP_");
            bar.appendChild(disconnected.getElement());
            var icons = 0;
            function showReconnecting() {
                if (reconnecting.show()) {
                    icons++;
                    updateIcons();
                }
                hideDisconnected();
            }
            Notification.showReconnecting = showReconnecting;
            function hideReconnecting() {
                if (reconnecting.hide()) {
                    icons--;
                    updateIcons();
                }
            }
            Notification.hideReconnecting = hideReconnecting;
            function hideDisconnected() {
                if (disconnected.hide()) {
                    icons--;
                    updateIcons();
                }
            }
            Notification.hideDisconnected = hideDisconnected;
            function showDisconnected() {
                if (disconnected.show()) {
                    icons++;
                    updateIcons();
                }
                hideReconnecting();
            }
            Notification.showDisconnected = showDisconnected;
            function updateIcons() {
                if (icons === 0) {
                    bar.classList.remove("activeIcon");
                }
                else {
                    bar.classList.add("activeIcon");
                }
            }
        })(Notification = Chat.Notification || (Chat.Notification = {}));
    })(Chat = UI.Chat || (UI.Chat = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var Chat;
    (function (Chat) {
        var PersonaManager;
        (function (PersonaManager) {
            var personaBox = document.getElementById("personaContainer");
            while (personaBox.firstChild !== null)
                personaBox.removeChild(personaBox.lastChild);
            var currentElement = null;
            var currentPersonaName = null;
            var currentPersonaAvatar = null;
            var changeListeners = [];
            var personaShortcuts = {};
            var personaShortcutLastUsage = [];
            var currentRoom = null;
            UI.Chat.addRoomChangedListener({
                handleEvent: function (e) {
                    UI.Chat.PersonaManager.setRoom(e);
                }
            });
            function setRoom(room) {
                currentRoom = room;
                clearPersonas();
            }
            PersonaManager.setRoom = setRoom;
            function clearPersonas() {
                while (personaBox.firstChild !== null)
                    personaBox.removeChild(personaBox.firstChild);
                currentPersonaAvatar = null;
                currentPersonaName = null;
                currentElement = null;
                personaShortcutLastUsage = [];
                personaShortcuts = {};
            }
            function clearPersona(name, avatar) {
                if (personaShortcuts[name + ";" + avatar] !== undefined) {
                    personaShortcutLastUsage.splice(personaShortcutLastUsage.indexOf(personaShortcuts[name + ";" + avatar]), 1);
                    personaBox.removeChild(personaShortcuts[name + ";" + avatar]);
                    if (currentElement === personaShortcuts[name + ";" + avatar]) {
                        unsetPersona();
                    }
                    delete (personaShortcuts[name + ";" + avatar]);
                }
                else {
                    console.debug("[PERSONAMANAGER] Attempt to remove unknown persona: " + name + ";" + avatar);
                }
            }
            PersonaManager.clearPersona = clearPersona;
            function getRoom() {
                return currentRoom;
            }
            PersonaManager.getRoom = getRoom;
            function createPersonaButton(name, avatar) {
                var ele = document.createElement("div");
                ele.classList.add("personaButton");
                name = name.trim();
                avatar = avatar === null ? null : avatar.trim();
                var handler = {
                    name: name,
                    avatar: avatar,
                    element: ele,
                    handleEvent: function (e) {
                        UI.Chat.PersonaManager.setPersona(this.name, this.avatar, this.element);
                    }
                };
                ele.addEventListener("click", handler);
                var shortName = name.split(" ");
                var finalName = "";
                var i = 0;
                while (finalName.length <= 6 && i < shortName.length) {
                    finalName += " " + shortName[i];
                    i++;
                }
                ele.appendChild(document.createTextNode(finalName.trim()));
                return ele;
            }
            function createAndUsePersona(name, avatar) {
                if (personaShortcuts[name + ";" + avatar] === undefined) {
                    personaShortcuts[name + ";" + avatar] = createPersonaButton(name, avatar);
                }
                if (personaShortcuts[name + ";" + avatar].parentElement === null) {
                    personaBox.appendChild(personaShortcuts[name + ";" + avatar]);
                }
                setPersona(name, avatar, personaShortcuts[name + ";" + avatar]);
                while (personaBox.scrollHeight > personaBox.clientHeight) {
                    personaBox.removeChild(personaShortcutLastUsage.shift());
                }
            }
            PersonaManager.createAndUsePersona = createAndUsePersona;
            function addListener(listener) {
                changeListeners.push(listener);
            }
            PersonaManager.addListener = addListener;
            function triggerListeners() {
                for (var i = 0; i < changeListeners.length; i++) {
                    changeListeners[i].handleEvent(currentPersonaName, currentPersonaAvatar);
                }
                if (Server.Chat.isConnected()) {
                    Server.Chat.sendPersona({
                        persona: currentPersonaName,
                        avatar: currentPersonaAvatar
                    });
                }
            }
            function setPersona(name, avatar, element) {
                if (currentElement !== null)
                    currentElement.classList.remove("active");
                var oldName = currentPersonaName;
                var oldAvatar = currentPersonaAvatar;
                if (currentElement === element) {
                    currentElement = null;
                    currentPersonaAvatar = null;
                    currentPersonaName = null;
                }
                else {
                    currentElement = element;
                    currentPersonaAvatar = avatar;
                    currentPersonaName = name;
                    currentElement.classList.add("active");
                    var index = personaShortcutLastUsage.indexOf(currentElement);
                    if (index !== -1) {
                        personaShortcutLastUsage.splice(index, 1);
                    }
                    personaShortcutLastUsage.push(currentElement);
                }
                if (oldName !== currentPersonaName || oldAvatar !== currentPersonaAvatar) {
                    triggerListeners();
                }
            }
            PersonaManager.setPersona = setPersona;
            function getPersonaName() {
                return currentPersonaName;
            }
            PersonaManager.getPersonaName = getPersonaName;
            function getPersonaAvatar() {
                return currentPersonaAvatar;
            }
            PersonaManager.getPersonaAvatar = getPersonaAvatar;
            function unsetPersona() {
                setPersona(null, null, currentElement);
            }
            PersonaManager.unsetPersona = unsetPersona;
        })(PersonaManager = Chat.PersonaManager || (Chat.PersonaManager = {}));
    })(Chat = UI.Chat || (UI.Chat = {}));
})(UI || (UI = {}));
var UI;
(function (UI) {
    var Chat;
    (function (Chat) {
        var PersonaDesigner;
        (function (PersonaDesigner) {
            var $designerBox = $(document.getElementById("personaDesignerBox")).hide();
            var target = document.getElementById("personaDesignerHolder");
            document.getElementById("personaAddButton").addEventListener("click", function () { UI.Chat.PersonaDesigner.callSelf(); });
            document.getElementById("personaDesignerCloseButton").addEventListener("click", function () { UI.Chat.PersonaDesigner.close(); });
            var open = false;
            var currentRoom = null;
            var personaName = document.getElementById("personaDesignerNameInput");
            var personaAvatar = document.getElementById("personaDesignerAvatarInput");
            var personaChoices = {};
            var lastMemory = [];
            UI.Chat.addRoomChangedListener({
                handleEvent: function (e) {
                    UI.Chat.PersonaDesigner.setRoom(e);
                }
            });
            document.getElementById("personaDesignerForm").addEventListener("submit", function (e) {
                UI.Chat.PersonaDesigner.createPersona();
                e.preventDefault();
            });
            function callSelf() {
                $designerBox.fadeIn(Application.Config.getConfig("animTime").getValue());
                open = true;
                setRoom(UI.Chat.getRoom());
            }
            PersonaDesigner.callSelf = callSelf;
            function close() {
                $designerBox.fadeOut(Application.Config.getConfig("animTime").getValue(), function () {
                    UI.Chat.PersonaDesigner.emptyOut();
                });
                open = false;
            }
            PersonaDesigner.close = close;
            function setRoom(room) {
                currentRoom = room;
                if (open) {
                    fillOut();
                }
            }
            PersonaDesigner.setRoom = setRoom;
            function fillOut() {
                emptyOut();
                loadMemory();
                for (var i = 0; i < lastMemory.length; i++) {
                    createPersona(lastMemory[i].name, lastMemory[i].avatar);
                }
            }
            PersonaDesigner.fillOut = fillOut;
            function emptyOut() {
                while (target.firstChild !== null)
                    target.removeChild(target.firstChild);
                personaChoices = {};
            }
            PersonaDesigner.emptyOut = emptyOut;
            function createPersona(name, avatar) {
                var name = name === undefined ? personaName.value.trim() : name;
                var avatar = avatar === undefined ? personaAvatar.value.trim() : avatar;
                personaName.value = "";
                personaAvatar.value = "";
                personaName.focus();
                if (name === "") {
                    return;
                }
                if (avatar === "") {
                    avatar = null;
                }
                var choice = new ChatAvatarChoice(name, avatar);
                if (personaChoices[choice.id] === undefined) {
                    target.appendChild(choice.getHTML());
                    personaChoices[choice.id] = choice;
                    lastMemory.push({
                        name: choice.nameStr,
                        avatar: choice.avatarStr
                    });
                    saveMemory();
                }
            }
            PersonaDesigner.createPersona = createPersona;
            function removeChoice(choice) {
                if (personaChoices[choice.id] !== undefined) {
                    target.removeChild(personaChoices[choice.id].getHTML());
                    delete (personaChoices[choice.id]);
                    lastMemory = [];
                    for (var id in personaChoices) {
                        lastMemory.push({
                            name: personaChoices[id].nameStr,
                            avatar: personaChoices[id].avatarStr
                        });
                    }
                    saveMemory();
                    UI.Chat.PersonaManager.clearPersona(choice.nameStr, choice.avatarStr);
                }
            }
            PersonaDesigner.removeChoice = removeChoice;
            function usePersona(name, avatar) {
                close();
                UI.Chat.PersonaManager.createAndUsePersona(name, avatar);
            }
            PersonaDesigner.usePersona = usePersona;
            function getMemoryString() {
                if (currentRoom === null) {
                    console.warn("[PERSONADESIGNER] Attempt to get memory string for null room.");
                    return "personaDesigner_0";
                }
                else {
                    return "personaDesigner_" + currentRoom.id;
                }
            }
            function loadMemory() {
                lastMemory = Application.LocalMemory.getMemory(getMemoryString(), []);
            }
            function saveMemory() {
                lastMemory.sort(function (a, b) {
                    var na = a.name.toLowerCase().latinise();
                    var nb = b.name.toLowerCase().latinise();
                    if (na < nb)
                        return -1;
                    if (nb < na)
                        return 1;
                    return 0;
                });
                Application.LocalMemory.setMemory(getMemoryString(), lastMemory);
            }
        })(PersonaDesigner = Chat.PersonaDesigner || (Chat.PersonaDesigner = {}));
    })(Chat = UI.Chat || (UI.Chat = {}));
})(UI || (UI = {}));
// Language Files
/// <reference path='Languages/Lingo.ts' />
/// <reference path='Languages/LingoPTBR.ts' />
/// <reference path='UI.ts' />
/// <reference path='Modules/WindowManager.ts' />
/// <reference path='Modules/Config.ts' />
/// <reference path='Modules/PageManager.ts' />
/// <reference path='Modules/Loading.ts' />
/// <reference path='Modules/Login.ts' />
/// <reference path='Modules/Handles.ts' />
/// <reference path='Modules/Language.ts' />
/// <reference path='Modules/Games.ts' />
/// <reference path='Modules/SoundController.ts' />
/// <reference path='Modules/SoundController/MusicPlayer.ts' />
/// <reference path='Modules/Chat.ts' />
/// <reference path='Modules/Chat/Avatar.ts' />
/// <reference path='Modules/Chat/Forms.ts' />
/// <reference path='Modules/Chat/Notification.ts' />
/// <reference path='Modules/Chat/PersonaManager.ts' />
/// <reference path='Modules/Chat/PersonaDesigner.ts' />
/// <reference path='Message/References.ts' /> 
var Server;
(function (Server) {
    Server.APPLICATION_URL = "http://app.redpg.com.br/service/";
    Server.WEBSOCKET_SERVERURL = "ws://app.redpg.com.br";
    Server.WEBSOCKET_CONTEXT = "/service/";
    Server.WEBSOCKET_PORTS = [80, 8080, 8081];
    Application.Config.registerConfiguration("wsPort", new WsportConfiguration(Server.WEBSOCKET_PORTS[0]));
    function getWebsocketURL() {
        return Server.WEBSOCKET_SERVERURL + ":" + Application.Config.getConfig("wsPort").getValue() + Server.WEBSOCKET_CONTEXT;
    }
    Server.getWebsocketURL = getWebsocketURL;
})(Server || (Server = {}));
var Server;
(function (Server) {
    var AJAX;
    (function (AJAX) {
        function requestPage(ajax, success, error) {
            var url = ajax.url;
            if (url.indexOf("://") === -1) {
                url = Server.APPLICATION_URL + url;
                if (Application.Login.hasSession()) {
                    url += ';jsessionid=' + Application.Login.getSession();
                }
            }
            var xhr = new XMLHttpRequest();
            var method = ajax.data !== null ? "POST" : "GET";
            xhr.open(method, url, true);
            xhr.responseType = ajax.responseType;
            xhr.addEventListener("loadend", {
                ajax: ajax,
                handleEvent: function (e) {
                    console.debug("AJAX request for " + this.ajax.url + " is complete.");
                    if (this.ajax.target !== this.ajax.TARGET_NONE) {
                        if (this.ajax.target === this.ajax.TARGET_GLOBAL) {
                            UI.Loading.stopLoading();
                        }
                        else if (this.ajax.target === this.ajax.TARGET_LEFT) {
                            UI.Loading.unblockLeft();
                        }
                        else if (this.ajax.target === this.ajax.TARGET_RIGHT) {
                            UI.Loading.unblockRight();
                        }
                    }
                }
            });
            xhr.addEventListener("load", {
                xhr: xhr,
                ajax: ajax,
                success: success,
                error: error,
                handleEvent: function (e) {
                    if (this.xhr.status >= 200 && this.xhr.status < 300) {
                        console.debug("[SUCCESS]: AJAX (" + this.ajax.url + ")...", { Status: this.xhr.status, XHR: this.xhr });
                        this.success.handleEvent(this.xhr.response, this.xhr);
                    }
                    else {
                        console.error("[ERROR]: AJAX (" + this.ajax.url + ")...", { Status: this.xhr.status, XHR: this.xhr });
                        this.error.handleEvent(this.xhr.response, this.xhr);
                    }
                }
            });
            xhr.addEventListener("error", {
                xhr: xhr,
                ajax: ajax,
                error: error,
                handleEvent: function (e) {
                    console.error("[ERROR] AJAX call for " + this.ajax.url + " resulted in network error. Event, XHR:", e, this.xhr);
                    this.error.handleEvent(e, this.xhr);
                }
            });
            if (ajax.target !== ajax.TARGET_NONE) {
                if (ajax.target === ajax.TARGET_GLOBAL) {
                    UI.Loading.startLoading();
                }
                else if (ajax.target === ajax.TARGET_LEFT) {
                    UI.Loading.blockLeft();
                }
                else if (ajax.target === ajax.TARGET_RIGHT) {
                    UI.Loading.blockRight();
                }
            }
            if (ajax.data !== null) {
                var data = {};
                for (var key in ajax.data) {
                    if (typeof ajax.data[key] === "number" || typeof ajax.data[key] === "string") {
                        data[key] = ajax.data[key];
                    }
                    else {
                        data[key] = JSON.stringify(ajax.data[key]);
                    }
                }
                console.debug("Ajax request for " + url + " includes Data. Data:", data);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.send($.param(data));
            }
            else {
                xhr.send();
            }
        }
        AJAX.requestPage = requestPage;
    })(AJAX = Server.AJAX || (Server.AJAX = {}));
})(Server || (Server = {}));
var Server;
(function (Server) {
    var Login;
    (function (Login) {
        var ACCOUNT_URL = "Account";
        function requestSession(silent, cbs, cbe) {
            var success = {
                cbs: cbs,
                cbe: cbe,
                handleEvent: function (response, xhr) {
                    if (response.user !== undefined || response.logged === true) {
                        if (response.user !== undefined) {
                            Application.Login.receiveLogin(response.user, response.session);
                            if (response.user.config !== undefined) {
                                Application.Config.updateFromObject(response.user.config);
                            }
                        }
                        else {
                            Application.Login.updateSessionLife();
                        }
                        if (this.cbs !== undefined) {
                            this.cbs.handleEvent(response, xhr);
                        }
                    }
                    else {
                        Application.Login.logout();
                        if (this.cbe !== undefined)
                            this.cbe.handleEvent(response, xhr);
                    }
                }
            };
            var error = {
                cbe: cbe,
                handleEvent: function (response, xhr) {
                    Application.Login.logout();
                    if (this.cbe !== undefined) {
                        this.cbe.handleEvent(response, xhr);
                    }
                }
            };
            var ajax = new AJAXConfig(ACCOUNT_URL);
            ajax.setResponseTypeJSON();
            if (silent) {
                ajax.data = { action: "requestSession" };
                ajax.setTargetNone();
            }
            else {
                ajax.data = { action: "login" };
                ajax.setTargetGlobal();
            }
            Server.AJAX.requestPage(ajax, success, error);
        }
        Login.requestSession = requestSession;
        function doLogin(email, password, cbs, cbe) {
            var success = {
                cbs: cbs,
                handleEvent: function (response, xhr) {
                    Application.Login.receiveLogin(response.user, response.session);
                    if (this.cbs !== undefined) {
                        this.cbs.handleEvent(response, xhr);
                    }
                }
            };
            var ajax = new AJAXConfig(ACCOUNT_URL);
            ajax.data = {
                login: email,
                password: password,
                action: "login"
            };
            ajax.setResponseTypeJSON();
            ajax.setTargetGlobal();
            Server.AJAX.requestPage(ajax, success, cbe);
        }
        Login.doLogin = doLogin;
        function doLogout(cbs, cbe) {
            var success = {
                cbs: cbs,
                handleEvent: function (response, xhr) {
                    Application.Login.logout();
                    if (this.cbs !== undefined) {
                        this.cbs.handleEvent(response, xhr);
                    }
                }
            };
            var error = {
                cbe: cbe,
                handleEvent: function (response, xhr) {
                    console.error("[ERROR] Failure while attempting to logout.");
                    if (this.cbe !== undefined) {
                        this.cbe.handleEvent(response, xhr);
                    }
                }
            };
            var ajax = new AJAXConfig(ACCOUNT_URL);
            ajax.data = { action: "logout" };
            ajax.setResponseTypeJSON();
            ajax.setTargetGlobal();
            Server.AJAX.requestPage(ajax, success, error);
        }
        Login.doLogout = doLogout;
    })(Login = Server.Login || (Server.Login = {}));
})(Server || (Server = {}));
var Server;
(function (Server) {
    var Games;
    (function (Games) {
        var GAMES_URL = "Game";
        var emptyCallback = { handleEvent: function () { } };
        function updateLists(cbs, cbe) {
            var success = {
                cbs: cbs,
                handleEvent: function (response, xhr) {
                    DB.GameDB.updateFromObject(response, true);
                    if (this.cbs !== undefined)
                        this.cbs.handleEvent(response, xhr);
                }
            };
            var error = cbe === undefined ? emptyCallback : cbe;
            var ajax = new AJAXConfig(GAMES_URL);
            ajax.setResponseTypeJSON();
            ajax.data = { action: "list" };
            ajax.setTargetLeftWindow();
            Server.AJAX.requestPage(ajax, success, error);
        }
        Games.updateLists = updateLists;
    })(Games = Server.Games || (Server.Games = {}));
})(Server || (Server = {}));
var Server;
(function (Server) {
    var URL;
    (function (URL) {
        function fixURL(url) {
            if (url.indexOf("://") === -1) {
                url = "http://" + url;
            }
            if (url.indexOf("www.dropbox.com") !== -1) {
                url = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
                var interr = url.indexOf("?dl");
                if (interr !== -1) {
                    url = url.substr(0, interr);
                }
            }
            return url;
        }
        URL.fixURL = fixURL;
    })(URL = Server.URL || (Server.URL = {}));
})(Server || (Server = {}));
var Server;
(function (Server) {
    var Chat;
    (function (Chat) {
        var ROOM_URL = "Room";
        Chat.CHAT_URL = "Chat";
        var emptyCallback = { handleEvent: function () { } };
        var socketController = new ChatWsController();
        var pollingController;
        Chat.currentController = socketController;
        var currentRoom = null;
        var openListener = undefined;
        var errorListener = undefined;
        var messageListeners = [];
        var personaListeners = [];
        var disconnectListeners = [];
        var personaInfo = {
            afk: false,
            focused: true,
            typing: false,
            persona: null,
            avatar: null
        };
        var reconnecting = false;
        var reconnectAttempts = 0;
        var maxReconnectAttempts = 5;
        Application.Login.addListener({
            handleEvent: function (isLogged) {
                if (!isLogged) {
                    Server.Chat.end();
                }
            }
        });
        function isReconnecting() {
            return reconnecting;
        }
        Chat.isReconnecting = isReconnecting;
        function setConnected() {
            reconnectAttempts = 0;
            reconnecting = false;
            UI.Chat.Notification.hideDisconnected();
            UI.Chat.Notification.hideReconnecting();
        }
        Chat.setConnected = setConnected;
        function giveUpReconnect() {
            var reconnectPls = {
                room: currentRoom,
                handleEvent: function () {
                    Server.Chat.enterRoom(this.room.id);
                }
            };
            var reconnectForMe = new ChatSystemMessage(true);
            reconnectForMe.addText("_CHATYOUAREDISCONNECTED_");
            reconnectForMe.addText(" ");
            reconnectForMe.addTextLink("_CHATDISCONNECTEDRECONNECT_", true, reconnectPls);
            UI.Chat.printElement(reconnectForMe.getElement(), true);
            UI.Chat.Notification.hideReconnecting();
            UI.Chat.Notification.showDisconnected();
        }
        Chat.giveUpReconnect = giveUpReconnect;
        function reconnect() {
            if (currentRoom === null) {
                return;
            }
            UI.Chat.Notification.showReconnecting();
            if (reconnectAttempts++ <= maxReconnectAttempts && Application.Login.isLogged()) {
                reconnecting = true;
                enterRoom(currentRoom.id);
            }
            else {
                giveUpReconnect();
            }
        }
        Chat.reconnect = reconnect;
        function leaveRoom() {
            currentRoom = null;
            reconnecting = false;
            Chat.currentController.end();
        }
        Chat.leaveRoom = leaveRoom;
        function enterRoom(roomid) {
            currentRoom = DB.RoomDB.getRoom(roomid);
            if (currentRoom === null) {
                console.error("[CHAT] Entering an unknown room at id " + roomid + ". Risky business.");
            }
            UI.Chat.Notification.showReconnecting();
            if (Chat.currentController.isReady()) {
                Chat.currentController.enterRoom(roomid);
            }
            else {
                Chat.currentController.onReady = {
                    controller: Chat.currentController,
                    roomid: roomid,
                    handleEvent: function () {
                        this.controller.enterRoom(this.roomid);
                    }
                };
                Chat.currentController.start();
            }
        }
        Chat.enterRoom = enterRoom;
        function sendStatus(info) {
            if (Chat.currentController.isReady()) {
                Chat.currentController.sendStatus(info);
            }
        }
        Chat.sendStatus = sendStatus;
        function sendPersona(info) {
            if (Chat.currentController.isReady()) {
                Chat.currentController.sendPersona(info);
            }
            else {
                console.debug("[CHAT] Attempt to send Persona while disconnected. Ignoring.", info);
            }
        }
        Chat.sendPersona = sendPersona;
        function isConnected() {
            return Chat.currentController.isReady();
        }
        Chat.isConnected = isConnected;
        function sendMessage(message) {
            if (Chat.currentController.isReady()) {
                Chat.currentController.sendMessage(message);
                message.roomid = currentRoom.id;
            }
            else {
                console.warn("[CHAT] Attempt to send messages while disconnected. Ignoring. Offending Message:", message);
            }
        }
        Chat.sendMessage = sendMessage;
        function hasRoom() {
            return currentRoom !== null;
        }
        Chat.hasRoom = hasRoom;
        function getRoom() {
            return currentRoom;
        }
        Chat.getRoom = getRoom;
        function getAllMessages(roomid, cbs, cbe) {
            if (!DB.RoomDB.hasRoom(roomid)) {
                console.warn("[CHAT] Attempted to load messages for undefined room.");
                if (cbe !== undefined)
                    cbe.handleEvent();
                return;
            }
            var success = {
                roomid: roomid,
                cbs: cbs,
                handleEvent: function (response, xhr) {
                    DB.RoomDB.getRoom(this.roomid).updateFromObject({ messages: response }, true);
                    if (this.cbs !== undefined)
                        this.cbs.handleEvent(response, xhr);
                }
            };
            var error = cbe === undefined ? emptyCallback : cbe;
            var ajax = new AJAXConfig(ROOM_URL);
            ajax.setResponseTypeJSON();
            ajax.data = { action: "messages", roomid: roomid };
            ajax.setTargetLeftWindow();
            Server.AJAX.requestPage(ajax, success, error);
        }
        Chat.getAllMessages = getAllMessages;
        function end() {
            currentRoom = null;
            Chat.currentController.end();
        }
        Chat.end = end;
        (function () {
            var getRoom = {
                handleEvent: function (e) {
                    var room = Server.Chat.getRoom();
                    var users = [];
                    for (var id in e[1]) {
                        e[1][id]['id'] = id;
                        users.push(e[1][id]);
                    }
                    UI.Chat.Avatar.resetForConnect();
                    room.updateFromObject({ users: users }, true);
                    Server.Chat.Memory.updateFromObject(e[2]);
                    room.updateFromObject({ messages: e[3] }, false);
                    if (!Server.Chat.isReconnecting()) {
                        UI.Chat.clearRoom();
                        UI.Chat.printGetAllButton();
                    }
                    Server.Chat.setConnected();
                    UI.Chat.Avatar.updateFromObject(users, true);
                    UI.Chat.printMessages(room.getOrderedMessages(), false);
                }
            };
            socketController.addMessageListener("getroom", getRoom);
            var status = {
                handleEvent: function (array) {
                    var info = {
                        id: array[1],
                        typing: array[2] === 1,
                        idle: array[3] === 1,
                        focused: array[4] === 1
                    };
                    UI.Chat.Avatar.updateFromObject([info], false);
                }
            };
            socketController.addMessageListener("status", status);
            var persona = {
                handleEvent: function (array) {
                    var info = {
                        id: array[1],
                        persona: array[2]['persona'] === undefined ? null : array[2]['persona'],
                        avatar: array[2]['avatar'] === undefined ? null : array[2]['avatar'],
                    };
                    UI.Chat.Avatar.updateFromObject([info], false);
                }
            };
            socketController.addMessageListener("persona", persona);
            var left = {
                handleEvent: function (array) {
                    var info = {
                        id: array[1],
                        online: false
                    };
                    UI.Chat.Avatar.updateFromObject([info], false);
                }
            };
            socketController.addMessageListener("left", left);
            var joined = {
                handleEvent: function (array) {
                    array[1].roomid = currentRoom.id;
                    DB.UserDB.updateFromObject([array[1]]);
                    UI.Chat.Avatar.updateFromObject([array[1]], false);
                }
            };
            socketController.addMessageListener("joined", joined);
            var message = {
                handleEvent: function (array) {
                    Server.Chat.getRoom().updateFromObject({ messages: [array[1]] }, false);
                    var message = DB.MessageDB.getMessage(array[1]['id']);
                    if (message.localid === null) {
                        UI.Chat.printMessage(message);
                    }
                }
            };
            socketController.addMessageListener("message", message);
            var memory = {
                handleEvent: function (array) {
                    Server.Chat.Memory.updateFromObject(array[2]);
                }
            };
            socketController.addMessageListener("memory", memory);
            var reconnectF = {
                handleEvent: function () {
                    Server.Chat.reconnect();
                }
            };
            socketController.addCloseListener(reconnectF);
        })();
    })(Chat = Server.Chat || (Server.Chat = {}));
})(Server || (Server = {}));
var Server;
(function (Server) {
    var Chat;
    (function (Chat) {
        var Memory;
        (function (Memory) {
            var configList = {};
            function getConfig(id) {
                return configList[id];
            }
            Memory.getConfig = getConfig;
            function registerChangeListener(id, listener) {
                if (configList[id] === undefined) {
                    console.warn("[ROOMMEMORY] Attempt to register a listener to unregistered configuration at " + id + ". Offending listener:", listener);
                    return;
                }
                configList[id].addChangeListener(listener);
            }
            Memory.registerChangeListener = registerChangeListener;
            function registerConfiguration(id, config) {
                if (configList[id] !== undefined) {
                    console.warn("[ROOMMEMORY] Attempt to overwrite registered Configuration at " + id + ". Offending configuration:", config);
                    return;
                }
                configList[id] = config;
            }
            Memory.registerConfiguration = registerConfiguration;
            function exportAsObject() {
                var result = {};
                for (var key in configList) {
                    result[key] = configList[key].getValue();
                }
                return result;
            }
            Memory.exportAsObject = exportAsObject;
            function updateFromObject(obj) {
                for (var key in configList) {
                    if (obj[key] === undefined) {
                        configList[key].reset();
                    }
                    else {
                        configList[key].storeValue(obj[key]);
                    }
                }
                console.debug("[ROOMMEMORY] Updated values from:", obj);
            }
            Memory.updateFromObject = updateFromObject;
        })(Memory = Chat.Memory || (Chat.Memory = {}));
    })(Chat = Server.Chat || (Server.Chat = {}));
})(Server || (Server = {}));
/// <reference path='Server.ts' />
/// <reference path='Modules/AJAX.ts' />
/// <reference path='Modules/Login.ts' />
/// <reference path='Modules/Games.ts' />
/// <reference path='Modules/URL.ts' />
/// <reference path='Modules/Chat.ts' />
/// <reference path='Modules/Chat/Memory.ts' /> 
/// <reference path='../typings/jquery/jquery.d.ts' />
/// <reference path='../typings/jqueryui/jqueryui.d.ts' />
/// <reference path='../typings/NonLatin.d.ts' />
/// <reference path='Debug.ts' />
/// <reference path='OnReady.ts' />
/// <reference path='Kinds/References.ts' />
/// <reference path='UI/Message/References.ts' />
/// <reference path='DB/References.ts' />
/// <reference path='Application/References.ts' />
/// <reference path='UI/References.ts' />
/// <reference path='Server/References.ts' /> 
/// <reference path='References.ts' />
UI.Language.searchLanguage();
UI.Language.updateScreen();
UI.PageManager.readWindows();
UI.WindowManager.updateWindowSizes();
Application.Login.addListener({
    handleEvent: function () {
        if (Application.Login.isLogged()) {
            UI.WindowManager.callWindow(('mainWindow'));
        }
        else {
            UI.WindowManager.callWindow("loginWindow");
            UI.Login.resetState();
            UI.Login.resetFocus();
        }
    }
});
Application.Login.searchLogin();
UI.Login.resetState();
UI.WindowManager.callWindow("loginWindow");
if (Application.Login.hasSession()) {
    Server.Login.requestSession(false);
}
else {
    UI.Login.resetFocus();
}
UI.PageManager.callPage(UI.idChangelog);
UI.PageManager.callPage(UI.idHome);
UI.PageManager.callPage(UI.idChat);
allReady();
//# sourceMappingURL=Application.js.map