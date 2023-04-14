declare class BaseStore {
    private data;
    constructor();
    getItem(key: string): string | undefined;
    get length(): number;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}
export default BaseStore;
