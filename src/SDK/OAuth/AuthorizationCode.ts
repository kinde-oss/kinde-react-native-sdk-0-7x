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

/**
 * The Oauth SDK module.
 * @module SDK/Oauth
 * @version 1.2.2
 */

import { AdditionalParameters, TokenResponse } from '../../types/KindeSDK';
import KindeSDK from '../KindeSDK';
import Storage from '../Storage';
import {
    OpenWebInApp,
    generateChallenge,
    generateRandomString
} from '../Utils';
import { AuthBrowserOptions } from '../../types/Auth';

class AuthorizationCode {
    /**
     * It opens the login page in the browser.
     * @param {KindeSDK} kindSDK - The KindeSDK instance
     * @param {boolean} [usePKCE=false] - boolean = false
     * @param {'login' | 'registration'} [startPage=login] - 'login' | 'registration' = 'login'
     * @param {AdditionalParameters} additionalParameters - AdditionalParameters = {}
     * @returns A promise that resolves when the URL is opened.
     */
    async authenticate(
        kindeSDK: KindeSDK,
        usePKCE: boolean = false,
        startPage: 'login' | 'registration' = 'login',
        additionalParameters: AdditionalParameters = {},
        options?: AuthBrowserOptions
    ): Promise<TokenResponse | null> {
        const stateGenerated = generateRandomString();
        Storage.setState(stateGenerated);

        let pkce;
        if (usePKCE) {
            const { codeChallenge, codeVerifier } = generateChallenge();
            Storage.setCodeVerifier(codeVerifier);
            pkce = {
                code_challenge: codeChallenge,
                code_challenge_method: 'S256'
            };
        }

        const urlParams = new URLSearchParams({
            client_id: kindeSDK.clientId,
            redirect_uri: kindeSDK.redirectUri,
            client_secret: kindeSDK.clientSecret || '',
            scope: kindeSDK.scope,
            grant_type: 'authorization_code',
            response_type: 'code',
            start_page: startPage,
            state: stateGenerated,
            ...(additionalParameters as Record<string, string>),
            ...pkce
        }).toString();

        return OpenWebInApp(
            `${kindeSDK.authorizationEndpoint}?${urlParams}`,
            kindeSDK,
            options
        );
    }
}

export default AuthorizationCode;
