import * as KeyChain from 'react-native-keychain';

export default class RNStorage {
    async getItem() {
        return KeyChain.getGenericPassword();
    }

    async setItem<T>(value: T) {
        const rs = await KeyChain.setGenericPassword(
            'kinde',
            typeof value === 'string' ? value : JSON.stringify(value)
        );
        return Boolean(rs);
    }

    clear() {
        return KeyChain.resetGenericPassword();
    }
}
