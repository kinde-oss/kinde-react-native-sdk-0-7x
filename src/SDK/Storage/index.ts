/**
 * Kinde Management API
 * Provides endpoints to manage your Kinde Businesses
 *
 * The version of the OpenAPI document: 1
 * Contact: support@kinde.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 *
 */

import jwtDecode from 'jwt-decode';
import {
    AccessTokenDecoded,
    IdTokenDecoded,
    TokenResponse,
    UserProfile
} from '../../types/KindeSDK';
import { TokenType } from '../Enums/TokenType.enum';
import BaseStore from './Base';
import { isExpo } from '../Utils';

/**
 * The Storage SDK module.
 * @module SDK/Storage
 * @version 1.2.1
 */

class Storage extends BaseStore {
    constructor() {
        super();
    }

    async getStorage() {
        if (isExpo) {
            const builder = await import('./ExpoStorage');
            return new builder.default();
        }
        const builder = await import('./RNStorage');
        return new builder.default();
    }

    async getToken(): Promise<TokenResponse | null> {
        const storage = await this.getStorage();
        const cred = await storage.getItem();
        try {
            if (typeof cred === 'object') {
                // RNStorage (KeyChain)
                return cred
                    ? JSON.parse((cred as { password: string }).password)
                    : null;
            }
            // Expo Secure Store
            return cred ? JSON.parse(cred as string) : null;
        } catch (_) {
            return null;
        }
    }

    async setToken(token: string) {
        const storage = await this.getStorage();
        return storage.setItem(token);
    }

    async getTokenType(type: TokenType) {
        const token = await this.getToken();
        const newType =
            type === TokenType.ID_TOKEN ? type : TokenType.ACCESS_TOKEN;
        return token?.[newType] ?? null;
    }

    async getAccessToken() {
        return this.getTokenType(TokenType.ACCESS_TOKEN);
    }

    async getIdToken(): Promise<string | null> {
        return this.getTokenType(TokenType.ID_TOKEN);
    }

    async getExpiredAt() {
        const token = await this.getAccessToken();
        return token ? jwtDecode<AccessTokenDecoded>(token)?.['exp'] : 0;
    }

    getState() {
        return this.getItem('state');
    }

    setState(newState: string): void {
        return this.setItem('state', this.convertString(newState));
    }

    getCodeVerifier() {
        return this.getItem('codeVerifier');
    }

    setCodeVerifier(newCodeVerifier: string): void {
        return this.setItem(
            'codeVerifier',
            this.convertString(newCodeVerifier)
        );
    }

    async clearAll() {
        this.clear();
        const storage = await this.getStorage();
        return storage.clear();
    }

    async getUserProfile(): Promise<UserProfile> {
        const token = await this.getIdToken();
        const payload = (token ? jwtDecode(token) : {}) as IdTokenDecoded;
        return {
            id: payload['sub'] ?? '',
            given_name: payload['given_name'] ?? '',
            family_name: payload['family_name'] ?? '',
            email: payload['email'] ?? '',
            picture: payload['picture'] ?? ''
        };
    }

    convertString(str: string | object): string {
        return typeof str === 'string' ? str : JSON.stringify(str);
    }
}

const sessionStorage = (globalThis.sessionStorage =
    globalThis.sessionStorage ?? new Storage()) as Storage;

export default sessionStorage;
