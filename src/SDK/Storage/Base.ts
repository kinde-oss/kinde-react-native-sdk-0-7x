class BaseStore {
    private data: Map<string, string>;

    constructor() {
        this.data = new Map<string, string>();
    }

    public getItem(key: string) {
        return this.data.get(key);
    }

    public get length() {
        return this.data.size;
    }

    public setItem(key: string, value: string) {
        this.data.set(key, value);
    }

    public removeItem(key: string) {
        this.data.delete(key);
    }

    public clear() {
        this.data = new Map<string, string>();
    }
}
export default BaseStore;
