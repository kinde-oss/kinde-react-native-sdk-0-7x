import * as SecureStore from 'expo-secure-store';

export default class ExpoStorage {
    async getItem() {
        try {
            const result = await SecureStore.getItemAsync('kinde_token');
            return result ? { password: result } : null;
        } catch (error) {
            console.error('Error getting item from SecureStore:', error);
            return null;
        }
    }

    async setItem<T>(value: T) {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            await SecureStore.setItemAsync('kinde_token', stringValue);
            return true;
        } catch (error) {
            console.error('Error setting item in SecureStore:', error);
            return false;
        }
    }

    async clear() {
        try {
            await SecureStore.deleteItemAsync('kinde_token');
            return true;
        } catch (error) {
            console.error('Error clearing SecureStore:', error);
            return false;
        }
    }
}
