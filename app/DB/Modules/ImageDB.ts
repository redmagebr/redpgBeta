module DB.ImageDB {
    var images : Array<ImageLink> = [];
    var changeTrigger : Trigger = new Trigger();

    export function getImageByName (name : string) {
        name = name.toLowerCase();
        for (var i = 0; i < images.length; i++) {
            if (images[i].getName().toLowerCase() === name) {
                return images[i];
            }
        }
        return null;
    }

    export function hasImageByName (name : string) {
        return (getImageByName(name) !== null);
    }

    export function getImageByLink (url : string) {
        for (var i = 0; i < images.length; i++) {
            if (images[i].getLink() === url) {
                return images[i];
            }
        }
        return null;
    }

    export function hasImageByLink (url : string) {
        return (getImageByLink(url) !== null);
    }
}