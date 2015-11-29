module UI.Games {
    var gameListTarget = document.getElementById("gameListTarget");

    var nickTarget = document.getElementById("gamesNickTarget");
    Application.Login.addListener(<Listener> {
        handleEvent : function (isLogged : boolean) {
            UI.Games.updateNick(isLogged);
        }
    })

    document.getElementById("gamesButton").addEventListener("click", function () {
        UI.Games.callSelf();
    });

    export function callSelf (ready? : boolean) {
        UI.PageManager.callPage(UI.idGames);

        if (ready !== true) {
            Server.Games.updateLists(<Listener> {
                handleEvent : function () {
                    UI.Games.callSelf(true);
                }
            });
            return;
        }

        var games = DB.GameDB.getOrderedGameList();

        while (gameListTarget.lastChild !== null) gameListTarget.removeChild(gameListTarget.lastChild);

        for (var i = 0; i < games.length; i++) {
            var div = <HTMLElement> document.createElement("div");
            var p =<HTMLElement> document.createElement("p");
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
                    roomid : roomList[k].id,
                    handleEvent : function () {
                        UI.Chat.callSelf(this.roomid);
                    }
                });
                p.appendChild(a);
            }
            div.appendChild(p);
            gameListTarget.appendChild(div);
        }
    };

    export function updateNick (isLogged : boolean) {
        if (!isLogged) {
            nickTarget.dataset['languagea'] = "Logged out";
        } else {
            nickTarget.dataset['languagea'] = Application.Login.getUser().getFullNickname();
        }
        UI.Language.updateText(nickTarget);
    };
}