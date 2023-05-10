import Storage from '../SDK/Storage';

declare global {
    var sessionStorage: typeof Storage;
}

export {};
