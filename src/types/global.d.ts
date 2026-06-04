import Storage from '../SDK/Storage';

declare global {
    /** Kinde SDK token store singleton (not the browser SessionStorage API). */
    var __kindeSdkStorage: Storage;
    /** React Native development mode flag */
    var __DEV__: boolean;
}

export {};
