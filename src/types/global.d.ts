import { Storage } from '../SDK/Storage';

declare global {
    var sessionStorage: Storage;
}

export {};
