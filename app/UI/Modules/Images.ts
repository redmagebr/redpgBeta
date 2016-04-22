module UI.Images {
    document.getElementById("imagesButton").addEventListener("click", function () { UI.Images.callSelf(); });
    
    export function callSelf () {
        UI.PageManager.callPage(UI.idImages);
    }
}