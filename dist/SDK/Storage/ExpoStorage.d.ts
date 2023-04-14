/**
 * The Storage SDK module.
 * @module SDK/Storage
 * @version 1.1.0
 */
export default class ExpoStorage {
    getItem(): Promise<string>;
    setItem<T>(value: T): Promise<boolean>;
    clear(): Promise<boolean>;
}
