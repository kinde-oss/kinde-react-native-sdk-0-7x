import { Linking } from 'react-native';
import Url from 'url-parse';
import { AdditionalParameters } from '../../types/KindeSDK';
import KindeSDK from '../KindeSDK';
import { sessionStorage } from '../Storage';
import {
    addAdditionalParameters,
    generateChallenge,
    generateRandomString
} from '../Utils';

class AuthorizationCode {
    /**
     * It opens the login page in the browser.
     * @param {KindeSDK} kindSDK - KindeSDK - The SDK object that you created in the previous step.
     * @param {boolean} [usePKCE=false] - boolean = false
     * @param {'login' | 'registration'} [startPage=login] - 'login' | 'registration' = 'login'
     * @param {AdditionalParameters} additionalParameters - AdditionalParameters = {}
     * @returns A promise that resolves when the URL is opened.
     */
    login(
        kindSDK: KindeSDK,
        usePKCE: boolean = false,
        startPage: 'login' | 'registration' = 'login',
        additionalParameters: AdditionalParameters = {}
    ): Promise<void> {
        const URLParsed = Url(kindSDK.authorizationEndpoint, true);
        URLParsed.query['client_id'] = kindSDK.clientId;
        URLParsed.query['redirect_uri'] = kindSDK.redirectUri;
        URLParsed.query['client_secret'] = kindSDK.clientSecret;
        URLParsed.query['grant_type'] = 'authorization_code';
        URLParsed.query['scope'] = kindSDK.scope;
        URLParsed.query['start_page'] = startPage;
        URLParsed.query['response_type'] = 'code';

        const stateGenerated = generateRandomString();
        URLParsed.query['state'] = stateGenerated;
        addAdditionalParameters(URLParsed.query, additionalParameters);
        sessionStorage.setState(stateGenerated);
        if (usePKCE) {
            const challenge = generateChallenge();
            URLParsed.query['code_challenge'] = challenge.codeChallenge;
            URLParsed.query['code_challenge_method'] = 'S256';
            sessionStorage.setCodeVerifier(challenge.codeVerifier);
        }
        return Linking.openURL(URLParsed.toString());
    }
}

export default AuthorizationCode;
