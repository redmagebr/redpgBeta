class MemoryVersion extends TrackerMemory {
    private importVersion : number;

    public storeValue (v : number) {
        this.importVersion = v;
    }

    public getValue () {
        return this.importVersion;
    }

    public exportAsObject () {
        return Server.Chat.Memory.version;;
    }
}