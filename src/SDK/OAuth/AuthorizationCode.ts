import { AdditionalParameters, TokenResponse } from '../../types/KindeSDK';
import KindeSDK from '../KindeSDK';
import Storage from '../Storage';
import {
    additionalParametersToLoginMethodParams,
    generateChallenge,
    generateRandomString,
    isAdditionalParameters,
    isLikelyUserCancelled
} from '../Utils';
import {
    AuthBrowserOptions,
    IOSCustomBrowser,
    AndroidCustomBrowser,
    warnDeprecatedAuthBrowserOptions
} from '../../types/Auth';
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

/** Timeout for waiting for redirect URL in fallback auth flow (2 minutes) */
const REDIRECT_TIMEOUT_MS = 2 * 60 * 1000;

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

const isIOSCustomBrowser = (value: string): value is IOSCustomBrowser => {
    return (
        value === 'safari' ||
        value === 'chrome' ||
        value === 'opera' ||
        value === 'firefox'
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

/**
 * Waits for a redirect URL to be received via Linking.
 * Returns both a promise and a cancel function to allow cleanup on errors.
 */
const waitForRedirectUrl = (
    redirectUri: string,
    timeoutMs: number
): { promise: Promise<string | null>; cancel: () => void } => {
    let cleanup = () => {
        // assigned below
    };

    const promise = new Promise<string | null>((resolve) => {
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
                } catch (e) {
                    // Suppress errors from deprecated API; log for debugging
                    if (__DEV__) {
                        console.debug(
                            'removeEventListener cleanup error (expected on newer RN):',
                            e
                        );
                    }
                }
            }
        };
    });

    return { promise, cancel: cleanup };
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
        // Warn about deprecated options (once per session)
        warnDeprecatedAuthBrowserOptions(options);

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
            options?.iosCustomBrowser &&
            isIOSCustomBrowser(options.iosCustomBrowser)
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

                // Map startPage to the correct IssuerRouteTypes:
                // - 'login' and 'none' -> login route
                // - 'registration' -> register route
                const issuerRoute =
                    startPage === 'registration'
                        ? IssuerRouteTypes.register
                        : IssuerRouteTypes.login;

                const authUrl = await generateAuthUrl(
                    kindeSDK.issuer,
                    issuerRoute,
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

                const { promise: redirectPromise, cancel: cancelRedirectWait } =
                    waitForRedirectUrl(
                        kindeSDK.redirectUri,
                        REDIRECT_TIMEOUT_MS
                    );

                try {
                    await Linking.openURL(sanitizeUrl(authUrl.url.toString()));
                } catch (openUrlError) {
                    // Clean up the listener immediately if openURL fails
                    cancelRedirectWait();
                    throw openUrlError;
                }

                const redirectedUrl = await redirectPromise;
                if (!redirectedUrl) return null;

                return await kindeSDK.getToken(redirectedUrl);
            } catch (fallbackError: any) {
                // Intentionally return null for all fallback errors to maintain
                // consistent behavior with the primary auth flow. The fallback is
                // a best-effort mechanism; callers should handle null returns.
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
