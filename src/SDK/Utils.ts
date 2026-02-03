import CryptoJS from 'crypto-js';
import { InvalidTypeException } from '../common/exceptions/invalid-type.exception';
import { PropertyRequiredException } from '../common/exceptions/property-required.exception';
import { UnexpectedException } from '../common/exceptions/unexpected.exception';
import { AdditionalParameters } from '../types/KindeSDK';
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
    // @ts-ignore
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

export const convertObject2FormData = (obj: Record<string, any>) => {
    const formData = new FormData();

    Object.keys(obj).forEach((k) => {
        formData.append(k, obj[k]);
    });

    return formData;
};

/**
 * All snake_case keys that are valid AdditionalParameters.
 * Used to detect whether the caller passed AdditionalParameters (snake_case)
 * vs LoginMethodParams (camelCase).
 */
const ADDITIONAL_PARAMETERS_KEYS: ReadonlyArray<keyof AdditionalParameters> = [
    'is_create_org',
    'org_code',
    'org_name',
    'connection_id',
    'login_hint',
    'plan_interest',
    'pricing_table_key'
] as const;

export const isAdditionalParameters = (
    additionalParameters: AdditionalParameters | LoginMethodParams
): boolean => {
    // Detect snake_case by checking if any of the known AdditionalParameters keys are present.
    // Note: 'audience' and 'lang' exist in both types, so they are not discriminators.
    return ADDITIONAL_PARAMETERS_KEYS.some((key) =>
        Object.prototype.hasOwnProperty.call(additionalParameters, key)
    );
};

export const additionalParametersToLoginMethodParams = (
    additionalParameters: AdditionalParameters
): Partial<LoginMethodParams> => {
    const audienceParam = additionalParameters.audience
        ? Array.isArray(additionalParameters.audience)
            ? additionalParameters.audience.join(',')
            : additionalParameters.audience
        : undefined;
    return {
        audience: audienceParam,
        isCreateOrg: additionalParameters.is_create_org,
        orgCode: additionalParameters.org_code,
        orgName: additionalParameters.org_name,
        connectionId: additionalParameters.connection_id,
        lang: additionalParameters.lang,
        loginHint: additionalParameters.login_hint,
        planInterest: additionalParameters.plan_interest,
        pricingTableKey: additionalParameters.pricing_table_key
    };
};

/**
 * Heuristic check to determine if an error was caused by user cancellation.
 * Used to gracefully handle authentication cancellation across different platforms.
 * @param {unknown} error - The error to check.
 * @returns {boolean} True if the error appears to be a user cancellation.
 */
export const isLikelyUserCancelled = (error: unknown): boolean => {
    const message =
        (error as any)?.message !== undefined
            ? String((error as any).message)
            : String(error);
    const lower = message.toLowerCase();
    return (
        lower.includes('user cancel') ||
        lower.includes('user_cancel') ||
        lower.includes('cancelled by user') ||
        lower.includes('canceled by user') ||
        /\bcancel(?:l)?ed\b/.test(lower) ||
        // iOS AppAuth error code -3 = OIDErrorCodeUserCanceledAuthorizationFlow
        /org\.openid\.appauth\.general error -3\b/.test(lower)
    );
};
