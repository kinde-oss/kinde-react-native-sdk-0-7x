import CryptoJS from 'crypto-js';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { InvalidTypeException } from '../common/exceptions/invalid-type.exception';
import { PropertyRequiredException } from '../common/exceptions/property-required.exception';
import { UnexpectedException } from '../common/exceptions/unexpected.exception';
import { AuthBrowserOptions } from '../types/Auth';
import { AdditionalParameters } from '../types/KindeSDK';
import KindeSDK from './KindeSDK';
import { AdditionalParametersAllow } from './constants';
import { LoginMethodParams } from '@kinde/js-utils';
import 'react-native-get-random-values';

/**
 * It takes a string or a WordArray and returns a string
 * @param {string | CryptoJS.lib.WordArray} str - The string to encode.
 * @returns A string
 */
function base64URLEncode(str: string | CryptoJS.lib.WordArray): string {
    return str
        .toString()
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * It takes a string or a WordArray and returns a string
 * @param {string | CryptoJS.lib.WordArray} buffer - The string or word array to hash.
 * @returns A string
 */
function sha256(buffer: string | CryptoJS.lib.WordArray): string {
    return CryptoJS.SHA256(buffer).toString(CryptoJS.enc.Base64);
}

/**
 * It generates a random string of a given length, and returns it
 * @param {number} [byteLength=32] - The number of bytes to generate. Defaults to 32.
 * @returns A random string of 32 bytes.
 */
export function generateRandomString(byteLength: number = 32): string {
    const randomBytes = new Uint8Array(byteLength);
    const cryptoBytes = crypto.getRandomValues(randomBytes);
    return base64URLEncode(CryptoJS.lib.WordArray.create(cryptoBytes));
}

/**
 * It generates a random string, hashes it, and then base64 encodes it
 * @returns An object with three properties: state, codeVerifier, and codeChallenge.
 */
export function generateChallenge(): {
    state: string;
    codeVerifier: string;
    codeChallenge: string;
} {
    const state = generateRandomString();
    const codeVerifier = generateRandomString();
    const codeChallenge = base64URLEncode(sha256(codeVerifier));
    return {
        state,
        codeVerifier,
        codeChallenge
    };
}

/**
 * If the reference is null or undefined, throw an error, otherwise return the reference.
 * @param {T | undefined | null} reference - The value to check.
 * @param {string} name - The name of the parameter that is being checked.
 * @returns A function that takes two parameters and returns either the first parameter or an Error.
 */
export function checkNotNull<T>(
    reference: T | undefined | null,
    name: string
): T | Error {
    if (reference === null || reference === undefined) {
        throw new PropertyRequiredException(name);
    }
    return reference;
}

const getValueByKey = (obj: Record<string, any>, key: string) => obj[key];

type AdditionalParametersKeys = keyof AdditionalParameters;

/**
 * It checks if the additionalParameters object is valid
 * @param {AdditionalParameters} additionalParameters - AdditionalParameters = {}
 * @returns An object with the keys and values of the additionalParameters object.
 */
export const checkAdditionalParameters = (
    additionalParameters: AdditionalParameters = {}
) => {
    if (typeof additionalParameters !== 'object') {
        throw new UnexpectedException('additionalParameters');
    }
    const keyExists = Object.keys(
        additionalParameters
    ) as AdditionalParametersKeys[];

    if (keyExists.length) {
        const keysAllow = Object.keys(
            AdditionalParametersAllow
        ) as AdditionalParametersKeys[];

        for (const key of keyExists) {
            if (
                keysAllow.includes(key) &&
                typeof additionalParameters[key] !==
                    AdditionalParametersAllow[key]
            ) {
                throw new InvalidTypeException(
                    key,
                    getValueByKey(AdditionalParametersAllow, key)
                );
            }
        }
        return additionalParameters;
    }
    return {};
};

/**
 * It takes a target object and an additionalParameters object and adds the additionalParameters
 * object's key/value pairs to the target object
 * @param target - Record<string, string | undefined>
 * @param {AdditionalParameters} additionalParameters - AdditionalParameters = {}
 * @returns A function that takes two parameters, target and additionalParameters.
 */
export const addAdditionalParameters = (
    target: Record<string, string | undefined>,
    additionalParameters: AdditionalParameters = {}
) => {
    const keyExists = Object.keys(additionalParameters);
    if (keyExists.length) {
        keyExists.forEach((key) => {
            target[key] = getValueByKey(additionalParameters, key);
        });
    }
    return target;
};

/**
 * Opens a web browser or in-app browser for authentication.
 * @param {string} url - The URL to open.
 * @param {KindeSDK} kindeSDK - The KindeSDK instance.
 * @param {AuthBrowserOptions} [options] - Optional browser options.
 * @returns A promise that resolves with the token or null if authentication fails.
 */
export const OpenWebInApp = async (
    url: string,
    kindeSDK: KindeSDK,
    options?: AuthBrowserOptions
) => {
    try {
        const response = await openWebBrowser(
            url,
            kindeSDK.redirectUri,
            options || kindeSDK.authBrowserOptions
        );
        if (response.type === 'success' && response.url) {
            return kindeSDK.getToken(response.url);
        }
        console.warn(
            'Something wrong when trying to authenticate. Reason: ',
            response.type
        );
        return null;
    } catch (error: any) {
        console.error(
            'Something wrong when trying to authenticate.',
            error.message
        );
        return null;
    }
};

/**
 * Opens a web browser using custom tabs on Android or default browser on other platforms.
 * @param {string} url - The URL to open.
 * @param {string} redirectUri - The redirect URI.
 * @param {AuthBrowserOptions} [options] - Optional browser options.
 * @returns A promise that resolves with the authentication response.
 * @throws Error if no web browser is found.
 */
export const openWebBrowser = async (
    url: string,
    redirectUri: string,
    options?: AuthBrowserOptions
) => {
    if (await InAppBrowser.isAvailable()) {
        return InAppBrowser.openAuth(url, redirectUri, {
            ephemeralWebSession: false,
            showTitle: false,
            enableUrlBarHiding: true,
            enableDefaultShare: false,
            forceCloseOnRedirection: false,
            showInRecents: true,
            ...options
        });
    }
    throw new Error('Not found web browser');
};

export const convertObject2FormData = (obj: Record<string, any>) => {
    const formData = new FormData();

    Object.keys(obj).forEach((k) => {
        formData.append(k, obj[k]);
    });

    return formData;
};

export const isAdditionalParameters = (
    additionalParameters: AdditionalParameters | LoginMethodParams
): boolean => {
    return (
        Object.prototype.hasOwnProperty.call(
            additionalParameters,
            'is_create_org'
        ) ||
        Object.prototype.hasOwnProperty.call(
            additionalParameters,
            'org_code'
        ) ||
        Object.prototype.hasOwnProperty.call(
            additionalParameters,
            'org_name'
        ) ||
        Object.prototype.hasOwnProperty.call(
            additionalParameters,
            'connection_id'
        ) ||
        Object.prototype.hasOwnProperty.call(additionalParameters, 'login_hint')
    );
};

export const additionalParametersToLoginMethodParams = (
    additionalParameters: AdditionalParameters
): Partial<LoginMethodParams> => {
    return {
        audience: additionalParameters.audience,
        isCreateOrg: additionalParameters.is_create_org,
        orgCode: additionalParameters.org_code,
        orgName: additionalParameters.org_name,
        connectionId: additionalParameters.connection_id,
        lang: additionalParameters.lang,
        loginHint: additionalParameters.login_hint
    };
};
