import { AdditionalParameters } from '../../types/KindeSDK';
import KindeSDK from '../KindeSDK';
declare class AuthorizationCode {
    /**
     * It opens the login page in the browser.
     * @param {KindeSDK} kindSDK - KindeSDK - The SDK object that you created in the previous step.
     * @param {boolean} [usePKCE=false] - boolean = false
     * @param {'login' | 'registration'} [startPage=login] - 'login' | 'registration' = 'login'
     * @param {AdditionalParameters} additionalParameters - AdditionalParameters = {}
     * @returns A promise that resolves when the URL is opened.
     */
    login(kindSDK: KindeSDK, usePKCE?: boolean, startPage?: 'login' | 'registration', additionalParameters?: AdditionalParameters): Promise<void>;
}
export default AuthorizationCode;
