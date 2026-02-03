import Storage from '../SDK/Storage';

declare global {
    var sessionStorage: typeof Storage;
    /** React Native development mode flag */
    var __DEV__: boolean;
}

export {};
