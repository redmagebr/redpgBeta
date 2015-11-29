/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/jqueryui/jqueryui.d.ts" />
/// <reference path="typings/NonLatin.d.ts" />
declare function startDebugging(): void;
declare function stopDebugging(): void;
declare var onReady: Array<Listener>;
declare function addOnReady(caller: string, reason: string, listener: Listener): void;
declare function allReady(): void;
interface Listener {
    handleEvent: Function;
}
interface PageManagerPage {
    $element: JQuery;
    leftSided: boolean;
}
interface PersonaInfo {
    afk: Boolean;
    focused: Boolean;
    typing: Boolean;
    persona: String;
    avatar: String;
}
interface PersonaLocalInfo {
    name: String;
    avatar: String;
}
interface ChatController {
    start(): void;
    enterRoom(id: number): void;
    sendStatus(info: PersonaInfo): void;
    sendPersona(info: PersonaInfo): void;
    sendMessage(message: Message): void;
    addCloseListener(obj: Listener): void;
    addOpenListener(obj: Listener): void;
    addMessageListener(type: string, obj: Listener): void;
    isReady(): boolean;
    onReady: Listener;
    end(): void;
}
declare class User {
    nickname: string;
    nicknamesufix: string;
    id: number;
    level: number;
    gameContexts: {
        [id: number]: UserGameContext;
    };
    roomContexts: {
        [id: number]: UserRoomContext;
    };
    isMe(): boolean;
    getGameContext(id: number): UserGameContext;
    releaseGameContext(id: number): void;
    getRoomContext(id: number): UserRoomContext;
    releaseRoomContext(id: number): void;
    getFullNickname(): string;
    getShortNickname(): string;
    updateFromObject(user: Object): void;
}
declare class UserGameContext {
    private user;
    private gameid;
    constructor(user: User);
    createRoom: boolean;
    createSheet: boolean;
    editSheet: boolean;
    viewSheet: boolean;
    deleteSheet: boolean;
    invite: boolean;
    promote: boolean;
    getUser(): User;
    updateFromObject(obj: {
        [id: string]: any;
    }): void;
}
declare class UserRoomContext {
    private user;
    roomid: number;
    constructor(user: User);
    getRoom(): Room;
    getUser(): User;
    private cleaner;
    private storyteller;
    isStoryteller(): boolean;
    isCleaner(): boolean;
    updateFromObject(user: Object): void;
    getUniqueNickname(): string;
}
declare class Room {
    gameid: number;
    id: number;
    description: string;
    name: string;
    playByPost: boolean;
    privateRoom: boolean;
    private users;
    private messages;
    getOrderedMessages(): Array<Message>;
    getOrderedUsers(): Array<User>;
    getStorytellers(): Array<UserRoomContext>;
    getUser(id: number): UserRoomContext;
    getUsersByName(str: string): Array<UserRoomContext>;
    getMe(): UserRoomContext;
    getGame(): Game;
    updateFromObject(room: Object, cleanup: boolean): void;
}
declare class Game {
    private users;
    private rooms;
    private sheets;
    description: string;
    name: string;
    id: number;
    freejoin: boolean;
    creatorid: number;
    creatornick: string;
    creatorsufix: string;
    getUser(id: number): UserGameContext;
    getRoom(id: number): Room;
    getSheet(id: number): SheetInstance;
    getOrderedRoomList(): Array<Room>;
    getOrderedSheetList(): Array<SheetInstance>;
    updateFromObject(game: Object, cleanup: boolean): void;
}
declare class SheetInstance {
    id: number;
    gameid: number;
    folder: string;
    name: string;
    values: Object;
    lastValues: string;
    creator: number;
    creatorNickname: string;
    styleId: number;
    styleName: string;
    styleCreator: number;
    styleCreatorNickname: string;
    styleSafe: boolean;
    view: boolean;
    edit: boolean;
    delete: boolean;
    promote: boolean;
    isPublic: boolean;
    changed: boolean;
    changeListeners: Array<Listener>;
    addChangeListener(list: Listener): void;
    triggerChanged(): void;
    getMemoryId(): string;
    setSaved(): void;
    setName(name: string): void;
    setValues(values: Object, local: boolean): void;
    updateFromObject(obj: Object): void;
}
declare class SimpleListener implements Listener {
    handleEvent: Function;
    constructor(f: Function);
    setValue(id: string, value: any): void;
    getValue(id: string): any;
}
declare class AJAXConfig {
    private _target;
    private _url;
    private _timeout;
    private _responseType;
    private _data;
    TARGET_NONE: number;
    TARGET_GLOBAL: number;
    TARGET_LEFT: number;
    TARGET_RIGHT: number;
    constructor(url: string);
    target: number;
    url: string;
    timeout: number;
    responseType: string;
    data: Object;
    setResponseTypeJSON(): void;
    setResponseTypeText(): void;
    setTargetNone(): void;
    setTargetGlobal(): void;
    setTargetLeftWindow(): void;
    setTargetRightWindow(): void;
}
declare class WebsocketController {
    private url;
    private socket;
    private keepAlive;
    private keepAliveTime;
    private keepAliveInterval;
    private static READYSTATE_OPEN;
    private onOpen;
    private onClose;
    private onMessage;
    private onError;
    constructor(url: string);
    connect(): void;
    isReady(): boolean;
    resetInterval(): void;
    disableInterval(): void;
    doKeepAlive(): void;
    send(action: string, obj: any): void;
    close(): void;
    addCloseListener(obj: Listener): void;
    addOpenListener(obj: Listener): void;
    addMessageListener(type: string, obj: Listener): void;
    triggerOpen(): void;
    triggerClose(): void;
    triggerMessage(e: MessageEvent): void;
}
declare class ChatWsController implements ChatController {
    private socket;
    private currentRoom;
    onReady: Listener;
    constructor();
    isReady(): boolean;
    start(): void;
    end(): void;
    enterRoom(id: number): void;
    sendStatus(info: PersonaInfo): void;
    sendPersona(info: PersonaInfo): void;
    sendMessage(message: Message): void;
    addCloseListener(obj: Listener): void;
    addOpenListener(obj: Listener): void;
    addMessageListener(type: string, obj: Listener): void;
}
declare class Configuration {
    private changeListeners;
    protected value: any;
    defValue: any;
    setFunction: Function;
    getFunction: Function;
    constructor(defV: any);
    getDefault(): any;
    reset(): void;
    addChangeListener(listener: Listener): void;
    storeValue(value: any): boolean;
    getValue(): any;
}
declare class NumberConfiguration extends Configuration {
    private min;
    private max;
    constructor(defValue: any, min: number, max: number);
    setFunction: (value: number) => void;
    getFunction: () => any;
}
declare class WsportConfiguration extends Configuration {
    setFunction: (value: number) => void;
}
declare class LanguageConfiguration extends Configuration {
    constructor();
    setFunction: (value: string) => void;
}
declare class BooleanConfiguration extends Configuration {
    constructor(bool: boolean);
    setFunction: (value: string) => void;
    getFunction: () => boolean;
}
declare class Memory {
    private changeListeners;
    protected value: any;
    defValue: any;
    setFunction: Function;
    getFunction: Function;
    constructor(defV: any);
    getDefault(): any;
    reset(): void;
    addChangeListener(listener: Listener): void;
    storeValue(value: any): boolean;
    getValue(): any;
}
declare class MemoryCombat extends Memory {
    private roundCounter;
    private currentParticipant;
    private buffs;
    constructor();
    getBuffs(): any[];
    getFunction: () => any[];
    setFunction: (value: any[]) => void;
}
declare class Buff {
    target: number;
    applier: number;
    appliedRound: number;
    duration: number;
    name: string;
    beginning: number;
    setTarget(id: number): void;
    setApplier(id: number): void;
    setAppliedRound(round: number): void;
    setName(name: string): void;
    setBeginning(begins: boolean | number): void;
    setDuration(dur: number): void;
    isActive(partId: number, round: number, beginning: boolean): boolean;
    exportId(): string;
    updateFromObject(obj: Array<any>): void;
    exportAsObject(): (number | string)[];
}
declare class ChatInfo {
    private floater;
    private textNode;
    private senderBold;
    private senderTextNode;
    private storyteller;
    constructor(floater: HTMLElement);
    showFor($element: JQuery, message?: Message): void;
    hide(): void;
    bindMessage(message: Message, element: HTMLElement): void;
}
declare class ChatAvatar {
    private element;
    private img;
    private typing;
    private afk;
    private name;
    private user;
    private persona;
    online: boolean;
    private changedOnline;
    constructor();
    getHTML(): HTMLElement;
    getUser(): User;
    setOnline(online: boolean): void;
    reset(): void;
    isChangedOnline(): boolean;
    setImg(img: String): void;
    setName(name: string): void;
    setFocus(focus: boolean): void;
    setTyping(typing: boolean): void;
    setAfk(afk: boolean): void;
    updateName(): void;
    updateFromObject(obj: Object): void;
}
declare class ChatNotificationIcon {
    private element;
    private hoverInfo;
    private language;
    constructor(icon: string, hasLanguage?: boolean);
    addText(text: string): void;
    getElement(): HTMLElement;
    show(): boolean;
    hide(): boolean;
}
declare class ChatFormState {
    private element;
    private state;
    static STATE_NORMAL: number;
    static STATE_ACTION: number;
    static STATE_STORY: number;
    static STATE_OFF: number;
    constructor(element: HTMLElement);
    getState(): number;
    isNormal(): boolean;
    isAction(): boolean;
    isStory(): boolean;
    isOff(): boolean;
    setState(state: number): void;
}
declare class ChatAvatarChoice {
    id: string;
    private avatar;
    private box;
    private useButton;
    private deleteButton;
    nameStr: String;
    avatarStr: String;
    constructor(name: String, avatar: String);
    getHTML(): HTMLElement;
}
declare class ChatSystemMessage {
    private element;
    private hasLanguage;
    constructor(hasLanguage: boolean);
    addLangVar(id: string, value: string): void;
    addTextLink(text: string, hasLanguage: boolean, click: Listener): void;
    addText(text: string): void;
    addElement(ele: HTMLElement): void;
    getElement(): HTMLElement;
}
declare module MessageFactory {
    var messageClasses: {
        [id: string]: typeof Message;
    };
    function registerMessage(msg: typeof Message, id: string, slashCommands: Array<string>): void;
    function registerSlashCommand(slash: typeof SlashCommand, slashCommands: Array<string>): void;
    function createMessageFromType(id: string): Message;
    function createTestingMessages(): Array<Message>;
    function getConstructorFromText(form: string): typeof SlashCommand;
    function createFromText(form: string): Message;
}
declare class SlashCommand {
    receiveCommand(slashCommand: string, message: string): boolean;
    isMessage(): boolean;
    getInvalidHTML(slashCommand: string, msg: string): HTMLElement;
}
declare class SlashClear extends SlashCommand {
}
declare class SlashReply extends SlashCommand {
}
declare class Message extends SlashCommand {
    id: number;
    localid: number;
    roomid: number;
    date: string;
    module: string;
    msg: string;
    special: {
        [id: string]: any;
    };
    private sending;
    origin: number;
    destination: Number | Array<number>;
    private updatedListeners;
    protected html: HTMLElement;
    clone: boolean;
    onPrint(): void;
    setPersona(name: string): void;
    getPersona(): string;
    findPersona(): void;
    getLocalId(): void;
    getUser(): UserRoomContext;
    addDestinationStorytellers(room: Room): void;
    addDestination(user: User): void;
    getDestinations(): Array<UserRoomContext>;
    makeMockUp(): Array<Message>;
    isWhisper(): boolean;
    isMine(): boolean;
    createHTML(): HTMLElement;
    getHTML(): HTMLElement;
    prepareSending(): void;
    getSpecial(id: string, defaultValue?: any): any;
    setSpecial(id: string, value: any): void;
    updateFromObject(obj: Object): void;
    exportAsObject(): Object;
    receiveCommand(slashCommand: string, msg: string): boolean;
    setMsg(str: string): void;
    getMsg(): string;
    unsetSpecial(id: string): void;
    addUpdatedListener(list: Listener): void;
    triggerUpdated(): void;
    doNotPrint(): boolean;
}
declare class MessageSystem extends Message {
    module: string;
    createHTML(): HTMLParagraphElement;
}
declare class MessageCountdown extends Message {
    private counter;
    module: string;
    static timeout: Number;
    static lastTimeout: MessageCountdown;
    constructor();
    createHTML(): HTMLParagraphElement;
    receiveCommand(slash: string, msg: string): boolean;
    getTarget(): any;
    setTarget(id: number): void;
    setCounter(e: number): void;
    getCounter(): number;
    updateCounter(e: number): void;
}
declare class MessageVote extends Message {
    module: string;
    private voters;
    private voteAmountText;
    private votersText;
    constructor();
    setVoteTarget(id: number): void;
    getVoteTarget(): any;
    createHTML(): HTMLParagraphElement;
    updateVoters(): void;
    addVote(user: UserRoomContext): void;
    removeVote(user: UserRoomContext): void;
}
declare class MessageWebm extends Message {
    module: string;
    createHTML(): HTMLParagraphElement;
    getName(): any;
    setName(name: string): void;
}
declare class MessageVideo extends Message {
    module: string;
    createHTML(): HTMLParagraphElement;
    getName(): any;
    setName(name: string): void;
}
declare class MessageSE extends Message {
    module: string;
    private playedBefore;
    onPrint(): void;
    createHTML(): HTMLParagraphElement;
    getName(): any;
    setName(name: string): void;
}
declare class MessageImage extends Message {
    module: string;
    createHTML(): HTMLParagraphElement;
    getName(): any;
    setName(name: string): void;
}
declare class MessageBGM extends Message {
    module: string;
    private playedBefore;
    onPrint(): void;
    createHTML(): HTMLParagraphElement;
    getName(): any;
    setName(name: string): void;
}
declare class MessageStream extends Message {
    module: string;
    createHTML(): any;
}
declare class MessageSheetcommand extends Message {
    module: string;
    createHTML(): any;
}
declare class MessageWhisper extends Message {
    module: string;
    constructor();
    onPrint(): void;
    createHTML(): HTMLElement;
    receiveCommand(slashCommand: string, msg: string): boolean;
    getInvalidHTML(slashCommand: string, msg: string): HTMLElement;
}
declare class MessageSheetdamage extends Message {
    module: string;
    createHTML(): HTMLParagraphElement;
    getType(): string;
    setTypeHP(): void;
    setTypeMP(): void;
    setTypeExp(): void;
    setLog(log: string): void;
    getLog(): String;
    setSheetName(name: string): void;
    getSheetName(): string;
    setAmount(amount: number): void;
    getAmount(): string;
}
declare class MessageSheetturn extends Message {
    module: string;
    createHTML(): HTMLParagraphElement;
    setSheetName(name: string): void;
    getSheetName(): string;
    setPlayer(id: number): void;
    getPlayer(): number;
}
declare class MessageDice extends Message {
    module: string;
    constructor();
    findPersona(): void;
    makeMockUp(): MessageDice[];
    createHTML(): HTMLElement;
    getInitialRoll(): string;
    getRolls(): Array<number>;
    getMod(): number;
    setMod(mod: number): void;
    getDice(): Array<number>;
    setDice(dice: Array<number>): void;
    addMod(mod: number): void;
    addDice(amount: number, faces: number): void;
    getResult(): number;
}
declare class MessageStory extends Message {
    module: string;
    makeMockUp(): Array<Message>;
    createHTML(): HTMLElement;
}
declare class MessageAction extends Message {
    module: string;
    findPersona(): void;
    createHTML(): HTMLElement;
}
declare class MessageOff extends Message {
    module: string;
    createHTML(): HTMLElement;
}
declare class MessageRoleplay extends Message {
    module: string;
    findPersona(): void;
    constructor();
    makeMockUp(): Array<Message>;
    createHTML(): HTMLElement;
    isIgnored(): boolean;
    getLanguage(): string;
    setLanguage(lang: string): void;
    setTranslation(message: string): void;
    getTranslation(): String;
}
declare class MessageUnknown extends Message {
    module: string;
    createHTML(): HTMLElement;
}
declare module DB {
}
declare module DB.UserDB {
    function hasUser(id: number): boolean;
    function getUser(id: number): User;
    function getAUser(id: number): User;
    function updateFromObject(obj: Array<Object>): void;
}
declare module DB.GameDB {
    function hasGame(id: number): boolean;
    function getGame(id: number): Game;
    function getOrderedGameList(): Array<Game>;
    function updateFromObject(obj: Array<Object>, cleanup: boolean): void;
}
declare module DB.RoomDB {
    var rooms: {
        [id: number]: Room;
    };
    function hasRoom(id: number): boolean;
    function getRoom(id: number): Room;
    function releaseRoom(id: number): boolean;
    function updateFromObject(obj: Array<Object>, cleanup: boolean): void;
}
declare module DB.MessageDB {
    var messageById: {
        [id: number]: Message;
    };
    function releaseMessage(id: number): boolean;
    function releaseLocalMessage(id: number): boolean;
    function releaseAllLocalMessages(): void;
    function hasMessage(id: number): boolean;
    function hasLocalMessage(id: number): boolean;
    function getMessage(id: number): Message;
    function getLocalMessage(id: number): Message;
    function registerLocally(msg: Message): void;
    function updateFromObject(obj: Array<Object>): void;
}
declare module DB.SheetDB {
    function addChangeListener(list: Listener): void;
    function removeChangeListener(list: Listener): void;
    function triggerChanged(sheet: SheetInstance): void;
    function hasSheet(id: number): boolean;
    function getSheet(id: number): SheetInstance;
    function releaseSheet(id: number): void;
    function updateFromObject(obj: Array<Object>): void;
}
declare module Application {
    function getMe(): User;
    function isMe(id: number): boolean;
    function getMyId(): number;
}
declare module Application.Config {
    function getConfig(id: string): Configuration;
    function registerChangeListener(id: string, listener: Listener): void;
    function registerConfiguration(id: string, config: Configuration): void;
    function exportAsObject(): {
        [id: string]: any;
    };
    function updateFromObject(obj: {
        [id: string]: any;
    }): void;
}
declare module Application.LocalMemory {
    function getMemory(id: string, defaultValue: any): any;
    function setMemory(id: string, value: any): void;
    function unsetMemory(id: string): void;
}
declare module Application.Login {
    function searchLogin(): void;
    function hasLastEmail(): boolean;
    function getLastEmail(): string;
    function isLogged(): boolean;
    function hasSession(): boolean;
    function getSession(): String;
    function logout(): void;
    function attemptLogin(email: string, password: string, cbs: Listener, cbe: Listener): void;
    function receiveLogin(userJson: Object, sessionid: string): void;
    function updateSessionLife(): void;
    function updateLocalStorage(): void;
    function keepAlive(): void;
    function addListener(listener: Listener): void;
    function getUser(): User;
}
declare class Lingo {
    ids: Array<string>;
    name: string;
    shortname: string;
    unknownLingo: string;
    langValues: {
        [id: string]: string;
    };
    setLingo(id: string, value: string): void;
    getLingo(id: string, dataset: {
        [id: string]: string;
    }): string;
}
declare module LingoList {
    function getLingo(id: string): Lingo;
    function storeLingo(lingo: Lingo): void;
}
declare var ptbr: Lingo;
declare module UI {
    var idChangelog: string;
    var idGames: string;
    var idChat: string;
    var idConfig: string;
    var idHome: string;
}
declare module UI.WindowManager {
    var currentLeftSize: number;
    var currentRightSize: number;
    function callWindow(id: string): void;
    function updateWindowSizes(): void;
}
declare module UI.Config {
    function bindInput(configName: string, input: HTMLInputElement): void;
}
declare module UI.PageManager {
    var $pages: {
        [id: string]: JQuery;
    };
    function getAnimationTime(): number;
    function callPage(id: string): void;
    function closeLeftPage(): void;
    function closeRightPage(): void;
    function readWindows(): void;
    function getCurrentLeft(): String;
}
declare module UI.Loading {
    var $leftLoader: JQuery;
    function stopLoading(): void;
    function startLoading(): void;
    function blockLeft(): void;
    function blockRight(): void;
    function unblockLeft(): void;
    function unblockRight(): void;
}
declare module UI.Login {
    function resetState(): void;
    function resetFocus(): void;
    function assumeEmail(email: string): void;
    function submitLogin(e: Event): void;
    function exposeLoginFailure(e: Event, statusCode: number): void;
}
declare module UI.Handles {
    function isAlwaysUp(): boolean;
    function mouseIn(handle: HTMLElement): void;
    function mouseOut(handle: HTMLElement): void;
    function setAlwaysUp(keepUp: boolean): void;
}
declare module UI.Language {
    function getLanguage(): Lingo;
    function searchLanguage(): void;
    function updateScreen(target?: HTMLElement | Document): void;
    function updateElement(element: HTMLElement): void;
    function updateText(element: HTMLElement): void;
    function addLanguageVariable(element: HTMLElement, id: string, value: string): void;
    function addLanguageValue(element: HTMLElement, value: string): void;
    function addLanguagePlaceholder(element: HTMLElement, value: string): void;
    function addLanguageTitle(element: HTMLElement, value: string): void;
    function markLanguage(element: HTMLElement): void;
}
declare module UI.Games {
    function callSelf(ready?: boolean): void;
    function updateNick(isLogged: boolean): void;
}
declare module UI.SoundController {
    function updateSEVolume(newVolume: number): void;
    function updateBGMVolume(newVolume: number): void;
    function getBGM(): HTMLAudioElement;
    function playDice(): void;
    function playAlert(): void;
    function isAutoPlay(): boolean;
    function playBGM(url: string): void;
    function playSE(url: string): void;
}
declare module UI.SoundController.MusicPlayer {
    function showContainer(): void;
    function hideContainer(): void;
    function showButton(): void;
    function hideButton(): void;
    function updateSeeker(perc: number): void;
    function stopPlaying(): void;
}
declare module UI.Chat {
    var messageCounter: number;
    function doAutomation(): boolean;
    function callSelf(roomid: number): void;
    function addRoomChangedListener(listener: Listener): void;
    function getRoom(): Room;
    function clearRoom(): void;
    function printElement(element: HTMLElement, doScroll?: boolean): void;
    function printMessage(message: Message, doScroll?: boolean): void;
    function printMessages(messages: Array<Message>, ignoreLowIds: boolean): void;
    function updateScrollPosition(instant?: boolean): void;
    function setScrolledDown(state: boolean): void;
    function sendMessage(message: Message): void;
    function getGetAllButton(): HTMLElement;
    function printGetAllButtonAtStart(): void;
    function printGetAllButton(): void;
}
declare module UI.Chat.Avatar {
    function getMe(): ChatAvatar;
    function resetForConnect(): void;
    function moveScroll(direction: number): void;
    function updatePosition(): void;
    function updateFromObject(obj: Array<Object>, cleanup: boolean): void;
}
declare module UI.Chat.Forms {
    function addOlderText(): void;
    function moveOlderText(direction: number): void;
    function updateFormState(hasPersona: any): void;
    function handleInputKeyboard(e: KeyboardEvent): void;
    function handleInputKeypress(e: KeyboardEvent): void;
    function sendMessage(): void;
    function isTyping(): boolean;
    function isFocused(): boolean;
    function isAfk(): boolean;
    function setTyping(newTyping: boolean): void;
    function setFocused(newFocused: boolean): void;
    function setAfk(newAfk: boolean): void;
    function considerRedirecting(event: KeyboardEvent): void;
    function rollDice(faces?: number): void;
    function setInput(str: string): void;
    function setLastWhisperFrom(user: UserRoomContext): void;
}
declare module UI.Chat.Notification {
    function showReconnecting(): void;
    function hideReconnecting(): void;
    function hideDisconnected(): void;
    function showDisconnected(): void;
}
declare module UI.Chat.PersonaManager {
    function setRoom(room: Room): void;
    function clearPersona(name: String, avatar: String): void;
    function getRoom(): Room;
    function createAndUsePersona(name: string, avatar: String): void;
    function addListener(listener: Listener): void;
    function setPersona(name: String, avatar: String, element: HTMLElement): void;
    function getPersonaName(): String;
    function getPersonaAvatar(): String;
    function unsetPersona(): void;
}
declare module UI.Chat.PersonaDesigner {
    function callSelf(): void;
    function close(): void;
    function setRoom(room: Room): void;
    function fillOut(): void;
    function emptyOut(): void;
    function createPersona(name?: string, avatar?: String): void;
    function removeChoice(choice: ChatAvatarChoice): void;
    function usePersona(name: string, avatar: String): void;
}
declare module Server {
    var APPLICATION_URL: string;
    var WEBSOCKET_SERVERURL: string;
    var WEBSOCKET_CONTEXT: string;
    var WEBSOCKET_PORTS: Array<number>;
    var APPLICATION_URL: string;
    var WEBSOCKET_SERVERURL: string;
    var WEBSOCKET_CONTEXT: string;
    var WEBSOCKET_PORTS: Array<number>;
    function getWebsocketURL(): string;
}
declare module Server.AJAX {
    function requestPage(ajax: AJAXConfig, success: any, error: any): void;
}
declare module Server.Login {
    function requestSession(silent: boolean, cbs?: Listener, cbe?: Listener): void;
    function doLogin(email: string, password: string, cbs?: Listener, cbe?: Listener): void;
    function doLogout(cbs?: Listener, cbe?: Listener): void;
}
declare module Server.Games {
    function updateLists(cbs?: Listener, cbe?: Listener): void;
}
declare module Server.URL {
    function fixURL(url: string): string;
}
declare module Server.Chat {
    var CHAT_URL: string;
    var currentController: ChatController;
    function isReconnecting(): boolean;
    function setConnected(): void;
    function giveUpReconnect(): void;
    function reconnect(): void;
    function leaveRoom(): void;
    function enterRoom(roomid: number): void;
    function sendStatus(info: PersonaInfo): void;
    function sendPersona(info: PersonaInfo): void;
    function isConnected(): boolean;
    function sendMessage(message: Message): void;
    function hasRoom(): boolean;
    function getRoom(): Room;
    function getAllMessages(roomid: number, cbs?: Listener, cbe?: Listener): void;
    function end(): void;
}
declare module Server.Chat.Memory {
    function getConfig(id: string): Memory;
    function registerChangeListener(id: string, listener: Listener): void;
    function registerConfiguration(id: string, config: Memory): void;
    function exportAsObject(): {
        [id: string]: any;
    };
    function updateFromObject(obj: {
        [id: string]: any;
    }): void;
}
