module UI.WindowManager {
    var currentWindow : string = "";
    var windowList : {[id : string] : HTMLElement}  = {};

    export var currentLeftSize : number;
    export var currentRightSize : number;

    var style = document.createElement('style');
    style.type = 'text/css';
    document.head.appendChild(style);
    var lastStyleInnerHTML = "";

    (function() {
        var children : HTMLCollection = document.body.children;
        for (var i = 0; i < children.length; i++) {
            var child : HTMLElement = <HTMLElement> children[i];
            if (child.classList.contains("window")) {
                windowList[child.getAttribute("id")] = child;
            }
        }
    })();

    export function callWindow (id : string) {
        if (windowList[id] === undefined) {
            console.log("--- Error: Attempt to call inexistent window: " + id + ", ignoring.");
            return;
        }

        if (id === currentWindow) return; // Same window, no point

        if (currentWindow === "") {
            console.debug("Detaching all windows.");
            for (var key in windowList) {
                document.body.removeChild(windowList[key]);
            }
        } else {
            console.debug("Detaching current window: " + currentWindow);
            document.body.removeChild(windowList[currentWindow]);
        }

        currentWindow = id;
        console.debug("Appending window: " + id);
        document.body.appendChild(windowList[currentWindow]);
    }

    export function updateWindowSizes () {
        var stylehtml = "";
        // Find left and right sizes
        var totalWidth = window.innerWidth;
        var rightSize = 698;
        var leftSize = 35 + 340 + 100; // Buttons + 4 Avatars + 2 extra dice buttons
        var remainingSize = totalWidth - rightSize - leftSize - 20;
        if (remainingSize > 255) {
            remainingSize = 255 + ((remainingSize - 255) * 1 / 2); // Right side grows too when too big
        }
        if (remainingSize < 0 || Application.Config.getConfig("fsmode").getValue()) {
            UI.Handles.setAlwaysUp(true);
            leftSize = totalWidth - 120;
            rightSize = leftSize;

            stylehtml += ".rightSideWindow { background-color: rgba(0,0,0,.5);} ";
        } else {
            UI.Handles.setAlwaysUp(false);
            leftSize += Math.floor(remainingSize / 85) * 85; // Fit as many avatars as possible
            rightSize = totalWidth - leftSize - 20; // Remove handle sizes
        }
        stylehtml += ".leftSideWindow { width: " + leftSize + "px; }\n.rightSideWindow { width: " + rightSize + "px; }";

        currentLeftSize = leftSize;
        currentRightSize = rightSize;

        // Set up handles
        if (UI.Handles.isAlwaysUp()) {
            stylehtml += "\n.leftSideWindow { left: 60px; }\n.rightSideWindow { right: 60px; }";
        }

        // Only do costly update if necessary
        if (stylehtml !== lastStyleInnerHTML) {
            style.innerHTML = stylehtml;
            lastStyleInnerHTML = stylehtml;
        }
    }

    window.addEventListener("resize", function () {
        UI.WindowManager.updateWindowSizes();
    });
}