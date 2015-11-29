module UI.Config {
    document.getElementById("configButton").addEventListener("click", function () { UI.PageManager.callPage(UI.idConfig); });

    export function bindInput (configName : string, input : HTMLInputElement) {
        Application.Config.getConfig(configName).addChangeListener(<Listener> {
            input : input,
            handleEvent : function (config : Configuration) {
                this.input.value = config.getValue().toString();
            }
        });

        input.addEventListener("change", {
            configName : configName,
            input : input,
            handleEvent : function () {
                Application.Config.getConfig(this.configName).storeValue(this.input.value);
            }
        });

        input.value = Application.Config.getConfig(configName).getValue().toString();
    }

    bindInput("chatfontfamily", <HTMLInputElement> document.getElementById("configChatFontFamily"));
    bindInput("chatMaxMessages", <HTMLInputElement> document.getElementById("configChatMaxMessages"));
    bindInput("chatfontsize", <HTMLInputElement> document.getElementById("configChatFontSize"));
    bindInput("chatshowhelp", <HTMLInputElement> document.getElementById("configChatShowHelp"));
    bindInput("animTime", <HTMLInputElement> document.getElementById("configAnimTime"));
    bindInput("autoBGM", <HTMLInputElement> document.getElementById("configChatAutoBGM"));
    bindInput("autoSE", <HTMLInputElement> document.getElementById("configChatAutoSE"));
    bindInput("autoImage", <HTMLInputElement> document.getElementById("configChatAutoImage"));
    bindInput("autoVIDEO", <HTMLInputElement> document.getElementById("configChatAutoVideo"));
}