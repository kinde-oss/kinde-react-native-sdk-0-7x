import { AdditionalParameters, TokenResponse } from '../../types/KindeSDK';
import KindeSDK from '../KindeSDK';
import Storage from '../Storage';
import {
    additionalParametersToLoginMethodParams,
    generateChallenge,
    generateRandomString,
    isAdditionalParameters
} from '../Utils';
import { AuthBrowserOptions } from '../../types/Auth';
import {
    generateAuthUrl,
    IssuerRouteTypes,
    LoginMethodParams,
    PromptTypes,
    sanitizeUrl,
    Scopes
} from '@kinde/js-utils';
import { authorize } from 'react-native-app-auth';
import { Linking } from 'react-native';

type IOSCustomBrowser = 'safari' | 'chrome' | 'opera' | 'firefox';
type AndroidCustomBrowser =
    | 'chrome'
    | 'firefox'
    | 'chromeCustomTab'
    | 'firefoxCustomTab'
    | 'samsung'
    | 'samsungCustomTab';

const isAndroidCustomBrowser = (
    value: string
): value is AndroidCustomBrowser => {
    return (
        value === 'chrome' ||
        value === 'firefox' ||
        value === 'chromeCustomTab' ||
        value === 'firefoxCustomTab' ||
        value === 'samsung' ||
        value === 'samsungCustomTab'
    );
};

const toAdditionalParameters = (
    additionalParameters: LoginMethodParams | AdditionalParameters,
    prompt: PromptTypes
): Record<string, string> => {
    const out: Record<string, string> = {
        prompt: String(prompt)
    };

    // Consumer passed Kinde-style (snake_case) params
    if (isAdditionalParameters(additionalParameters)) {
        const params = additionalParameters as AdditionalParameters;
        // Avoid Object.entries for older TS lib targets.
        for (const key in params) {
            if (!Object.prototype.hasOwnProperty.call(params, key)) continue;
            const value = (params as Record<string, unknown>)[key];
            if (value === undefined || value === null) continue;
            out[key] = Array.isArray(value)
                ? (value as unknown[]).join(',')
                : String(value);
        }
        return out;
    }

    // Consumer passed LoginMethodParams (camelCase) params
    const params = additionalParameters as LoginMethodParams;
    if (params.audience !== undefined) {
        out.audience = Array.isArray(params.audience)
            ? params.audience.join(',')
            : String(params.audience);
    }
    if (params.connectionId !== undefined)
        out.connection_id = String(params.connectionId);
    if (params.isCreateOrg !== undefined)
        out.is_create_org = String(params.isCreateOrg);
    if (params.lang !== undefined) out.lang = String(params.lang);
    if (params.loginHint !== undefined)
        out.login_hint = String(params.loginHint);
    if (params.orgCode !== undefined) out.org_code = String(params.orgCode);
    if (params.orgName !== undefined) out.org_name = String(params.orgName);
    if (params.planInterest !== undefined)
        out.plan_interest = String(params.planInterest);
    if (params.pricingTableKey !== undefined)
        out.pricing_table_key = String(params.pricingTableKey);

    return out;
};

const isLikelyUserCancelled = (error: unknown): boolean => {
    const message =
        (error as any)?.message !== undefined
            ? String((error as any).message)
            : String(error);
    const lower = message.toLowerCase();
    return lower.includes('cancel') || lower.includes('user_cancel');
};

const waitForRedirectUrl = async (
    redirectUri: string,
    timeoutMs: number
): Promise<string | null> => {
    return new Promise((resolve) => {
        let cleanup = () => {
            // assigned below
        };

        const timeout = setTimeout(() => {
            cleanup();
            resolve(null);
        }, timeoutMs);

        const handler = (event: any) => {
            const url = event?.url ? String(event.url) : '';
            if (!url) return;
            if (!url.startsWith(redirectUri)) return;
            cleanup();
            resolve(url);
        };

        const subscription = (Linking as any).addEventListener
            ? (Linking as any).addEventListener('url', handler)
            : null;

        cleanup = () => {
            clearTimeout(timeout);
            if (subscription?.remove) subscription.remove();
            // Back-compat for older RN versions
            if ((Linking as any).removeEventListener) {
                try {
                    (Linking as any).removeEventListener('url', handler);
                } catch (_) {
                    // ignore
                }
            }
        };
    });
};

class AuthorizationCode {
    /**
     * It opens the login page in the browser.
     * @param {KindeSDK} kindSDK - The KindeSDK instance
     * @param {boolean} [usePKCE=false] - boolean = false
     * @param {'login' | 'registration' | 'none'} startPage - The start page type
     * @param {AdditionalParameters} additionalParameters - AdditionalParameters = {}
     * @returns A promise that resolves when the URL is opened.
     */
    async authenticate(
        kindeSDK: KindeSDK,
        startPage: 'login' | 'registration' | 'none',
        additionalParameters: LoginMethodParams | AdditionalParameters,
        options?: AuthBrowserOptions
    ): Promise<TokenResponse | null> {
        let prompt: PromptTypes;
        switch (startPage) {
            case 'login':
                prompt = PromptTypes.login;
                break;
            case 'registration':
                prompt = PromptTypes.create;
                break;
            case 'none':
                prompt = PromptTypes.none;
                break;
        }

        const scopes = kindeSDK.scope.split(' ') as Scopes[];
        const iosPrefersEphemeralSession =
            options?.iosPrefersEphemeralSession ?? options?.ephemeralWebSession;

        const iosCustomBrowser: IOSCustomBrowser | undefined =
            options?.iosCustomBrowser === 'safari' ||
            options?.iosCustomBrowser === 'chrome' ||
            options?.iosCustomBrowser === 'opera' ||
            options?.iosCustomBrowser === 'firefox'
                ? options.iosCustomBrowser
                : undefined;

        const androidAllowCustomBrowsers: AndroidCustomBrowser[] | undefined =
            options?.androidAllowCustomBrowsers?.filter(isAndroidCustomBrowser);

        // Clear any stale PKCE verifier from a previous auth attempt before starting a new flow.
        // This ensures we don't accidentally use an old verifier if something goes wrong.
        Storage.setCodeVerifier('');

        try {
            const result = await authorize({
                clientId: kindeSDK.clientId,
                redirectUrl: kindeSDK.redirectUri,
                scopes,
                serviceConfiguration: {
                    authorizationEndpoint: kindeSDK.authorizationEndpoint,
                    tokenEndpoint: kindeSDK.tokenEndpoint
                },
                additionalParameters: toAdditionalParameters(
                    additionalParameters,
                    prompt
                ),
                usePKCE: true,
                skipCodeExchange: true,
                iosPrefersEphemeralSession:
                    iosPrefersEphemeralSession === undefined
                        ? false
                        : Boolean(iosPrefersEphemeralSession),
                iosCustomBrowser,
                androidAllowCustomBrowsers:
                    androidAllowCustomBrowsers &&
                    androidAllowCustomBrowsers.length
                        ? androidAllowCustomBrowsers
                        : undefined
            });

            if (!result.authorizationCode) {
                throw new Error(
                    'Authorization did not return an authorizationCode (expected skipCodeExchange=true).'
                );
            }

            // react-native-app-auth gives us the PKCE verifier used; we need it for our manual token exchange.
            if (result.codeVerifier) {
                Storage.setCodeVerifier(result.codeVerifier);
            }

            return await kindeSDK.getToken(
                `${kindeSDK.redirectUri}?code=${encodeURIComponent(
                    result.authorizationCode
                )}`
            );
        } catch (error: any) {
            // Keep parity with previous behavior: cancel/dismiss should resolve null.
            if (isLikelyUserCancelled(error)) {
                const message = error?.message ?? String(error);
                console.warn('Authentication cancelled or failed.', message);
                return null;
            }

            // Fallback path: This triggers when react-native-app-auth throws a non-cancellation
            // error (e.g., native module not linked, ASWebAuthenticationSession unavailable, etc.).
            // Opens the auth URL in the system browser and waits for the redirect back via Linking.
            // This helps keep apps working even if AppAuth native integration isn't complete.
            try {
                const normalizedParams: LoginMethodParams =
                    isAdditionalParameters(additionalParameters)
                        ? (additionalParametersToLoginMethodParams(
                              additionalParameters as AdditionalParameters
                          ) as LoginMethodParams)
                        : (additionalParameters as LoginMethodParams);

                const { codeChallenge, codeVerifier, state } =
                    generateChallenge();
                const nonce = generateRandomString();
                const params = {
                    ...normalizedParams,
                    prompt,
                    clientId: kindeSDK.clientId,
                    redirectURL: kindeSDK.redirectUri,
                    scope: scopes,
                    codeChallenge,
                    nonce,
                    state,
                    codeChallengeMethod: 'S256'
                };

                const authUrl = await generateAuthUrl(
                    kindeSDK.issuer,
                    startPage === 'login'
                        ? IssuerRouteTypes.login
                        : IssuerRouteTypes.register,
                    params
                );

                Storage.setState(state);
                Storage.setCodeVerifier(codeVerifier);
                Storage.setNonce(nonce);
                Storage.setCodeChallenge(codeChallenge);

                const canOpen = await Linking.canOpenURL(
                    sanitizeUrl(authUrl.url.toString())
                );
                if (!canOpen) return null;

                await Linking.openURL(sanitizeUrl(authUrl.url.toString()));
                const redirectedUrl = await waitForRedirectUrl(
                    kindeSDK.redirectUri,
                    2 * 60 * 1000
                );
                if (!redirectedUrl) return null;

                return await kindeSDK.getToken(redirectedUrl);
            } catch (fallbackError: any) {
                const message =
                    fallbackError?.message ??
                    fallbackError ??
                    String(fallbackError);
                console.warn('Authentication fallback failed.', message);
                return null;
            }
        }
    }
}

export default AuthorizationCode;
