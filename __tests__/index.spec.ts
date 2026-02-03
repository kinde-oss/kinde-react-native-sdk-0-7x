// @ts-nocheck

const { KindeSDK } = require(process.cwd() + '/src/index');
import jwtDecode from 'jwt-decode';
import Url from 'url-parse';
import RNStorage from '../src/SDK/Storage/RNStorage';
import Storage from '../src/SDK/Storage';
import { authorize } from 'react-native-app-auth';

const crypto = require('crypto');

Object.defineProperty(globalThis, 'crypto', {
    value: {
        getRandomValues: (arr) => crypto.randomBytes(arr.length),
        subtle: {
            digest: (algorithm, data) => {
                return new Promise((resolve) => {
                    const hash = crypto.createHash(
                        algorithm.replace('-', '').toLowerCase()
                    );
                    hash.update(Buffer.from(data));
                    resolve(hash.digest());
                });
            }
        }
    }
});

const fakeTokenResponse = {
    access_token: 'this_is_access_token',
    refresh_token: 'this_is_refresh_token',
    id_token: 'this_is_id_token',
    scope: 'this_is_scope',
    token_type: 'this_is_token_type',
    expires_in: 86400 // 1 day
};

function FormDataMock() {
    this[Symbol.for('state')] = [] as Array<{
        name: string;
        value: string;
    }>;
}

FormDataMock.prototype.append = function (key: string, value: string) {
    this[Symbol.for('state')].push({ key, value });
};

jest.mock('react-native-keychain', () => ({
    setGenericPassword: jest.fn().mockResolvedValue(),
    getGenericPassword: jest.fn().mockResolvedValue(),
    resetGenericPassword: jest.fn().mockResolvedValue()
}));

jest.mock('react-native-app-auth', () => ({
    authorize: jest.fn().mockResolvedValue({}),
    logout: jest.fn().mockResolvedValue({})
}));

jest.mock('react-native', () => ({
    Linking: {
        canOpenURL: jest.fn().mockResolvedValue(true),
        openURL: jest.fn().mockResolvedValue(true),
        addEventListener: jest.fn((eventName, handler) => {
            // Default behavior: immediately simulate a redirect back into the app.
            if (eventName === 'url' && typeof handler === 'function') {
                setTimeout(() => {
                    try {
                        handler({
                            url: 'myapp://myhost.kinde.com/kinde_callback'
                        });
                    } catch (_) {
                        // ignore
                    }
                }, 0);
            }
            return { remove: jest.fn() };
        }),
        removeEventListener: jest.fn()
    }
}));

global.FormData = FormDataMock;

const configuration = {
    issuer: 'https://myhost.kinde.com',
    redirectUri: 'myapp://myhost.kinde.com/kinde_callback',
    clientId: 'test@live',
    logoutRedirectUri: 'myapp://myhost.kinde.com/kinde_callback',
    scope: 'openid profile email offline',
    authorizationEndpoint: 'https://myhost.kinde.com/oauth2/auth',
    tokenEndpoint: 'https://myhost.kinde.com/oauth2/token',
    logoutEndpoint: 'https://myhost.kinde.com/logout',
    fakeState: 'uUj8nEDL-jxeDbS_si86i7UsFmG5ewf0axDu96pdHGc',
    fakeCodeVerifier: 'K9E0HqVA4oxGuJqFWoasgmGKzI3Uxehdr9nTF2jaLR8',
    fakeCodeChallenge: '3Aqg8_tu8aNwnxPmhE1b1ONsThy-b6hppET0knva9Kc'
};

const fakeUserDetail = {
    id: 'kp:58ece9f68a7c4c098efc1cf45c774e16',
    given_name: 'test',
    family_name: 'user',
    email: 'usertesting@yopmail.com',
    picture: ''
};

const fakePayloadFromDecodeToken = {
    azp: 'test@live',
    iss: 'https://myhost.kinde.com',
    org_code: 'org_e5f28e1676d',
    org_codes: ['org_e5f28e1676d'],
    permissions: ['read:profile', 'read:email']
};

const getValueByKey = (obj: Record<string, any>, key: string) => obj[key];

jest.mock(process.cwd() + '/src/SDK/Utils', () => ({
    isAdditionalParameters: jest.requireActual(process.cwd() + '/src/SDK/Utils')
        .isAdditionalParameters,
    additionalParametersToLoginMethodParams: jest.requireActual(
        process.cwd() + '/src/SDK/Utils'
    ).additionalParametersToLoginMethodParams,
    isLikelyUserCancelled: jest.requireActual(process.cwd() + '/src/SDK/Utils')
        .isLikelyUserCancelled,
    checkNotNull: jest.fn((reference, name) => {
        if (reference === null || reference === undefined) {
            throw new Error(`${name} cannot be empty`);
        }
        return reference;
    }),
    checkAdditionalParameters: jest.fn(),
    addAdditionalParameters: jest.fn((target, additionalParameters) => {
        const keyExists = Object.keys(additionalParameters);
        if (keyExists.length) {
            keyExists.forEach((key) => {
                target[key] = getValueByKey(additionalParameters, key);
            });
        }
        return target;
    }),
    convertObject2FormData: jest.fn((obj: Record<string, any>) => {
        const formData = new FormData();

        Object.keys(obj).forEach((k) => {
            formData.append(k, obj[k]);
        });

        return formData;
    })
}));

jest.mock(process.cwd() + '/src/ApiClient');

const dataDecoded = {
    azp: 'test@live',
    iss: 'https://myhost.kinde.com',
    org_code: 'org_e5f28e1676d',
    org_codes: ['org_e5f28e1676d'],
    permissions: ['read:profile', 'read:email'],
    exp: new Date().getTime() / 1000 + 1000 * 60 * 60,
    email: 'usertesting@yopmail.com',
    family_name: 'user',
    given_name: 'test',
    sub: 'kp:58ece9f68a7c4c098efc1cf45c774e16',
    preferred_email: 'usertesting@yopmail.com'
};

jest.mock('jwt-decode', () => jest.fn().mockReturnValue());

let globalClient;
describe('KindeSDK', () => {
    beforeEach(() => {
        jwtDecode.mockReturnValueOnce(dataDecoded);

        globalClient = new KindeSDK(
            configuration.issuer,
            configuration.redirectUri,
            configuration.clientId,
            configuration.logoutRedirectUri
        );

        RNStorage.prototype.getItem = jest
            .fn()
            .mockReturnValue({ password: null });

        RNStorage.prototype.setItem = jest.fn();

        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve(fakeTokenResponse)
            })
        );

        fetch.mockClear();
        jest.clearAllMocks();
    });

    describe('Initial', () => {
        test('throws an error when issuer is not passed', () => {
            expect(() => {
                new KindeSDK();
            }).toThrow('Issuer cannot be empty');
        });

        test('throws an error when redirectUrl is not passed', () => {
            expect(() => {
                new KindeSDK(configuration.issuer);
            }).toThrow('Redirect URI cannot be empty');
        });

        test('throws an error when Client ID is not passed', () => {
            expect(() => {
                new KindeSDK(configuration.issuer, configuration.redirectUri);
            }).toThrow('Client Id cannot be empty');
        });

        test('throws an error when logoutRedirectUri is not passed', () => {
            expect(() => {
                new KindeSDK(
                    configuration.issuer,
                    configuration.redirectUri,
                    configuration.clientId
                );
            }).toThrow('Logout Redirect URI');
        });

        test('Matching authorizationEndpoint', () => {
            expect(globalClient.authorizationEndpoint).toBe(
                configuration.authorizationEndpoint
            );
        });

        test('Matching tokenEndpoint', () => {
            expect(globalClient.tokenEndpoint).toBe(
                configuration.tokenEndpoint
            );
        });

        test('Matching logoutEndpoint', () => {
            expect(globalClient.logoutEndpoint).toBe(
                configuration.logoutEndpoint
            );
        });
    });

    describe('Redirect', () => {
        test('[RNStorage] Open authenticate endpoint', async () => {
            authorize.mockResolvedValue({
                authorizationCode: 'random_code',
                codeVerifier: configuration.fakeCodeVerifier
            });
            await globalClient.login();
            expect(Storage.getCodeVerifier()).toEqual(
                configuration.fakeCodeVerifier
            );

            expect(authorize).toHaveBeenCalledWith(
                expect.objectContaining({
                    clientId: configuration.clientId,
                    redirectUrl: configuration.redirectUri,
                    scopes: configuration.scope.split(' '),
                    serviceConfiguration: {
                        authorizationEndpoint:
                            configuration.authorizationEndpoint,
                        tokenEndpoint: configuration.tokenEndpoint
                    },
                    skipCodeExchange: true,
                    usePKCE: true
                })
            );
        });

        test('[RNStorage] Open registration endpoint', async () => {
            authorize.mockResolvedValue({
                authorizationCode: 'random_code',
                codeVerifier: configuration.fakeCodeVerifier
            });
            await globalClient.register();

            expect(authorize).toHaveBeenCalledWith(
                expect.objectContaining({
                    clientId: configuration.clientId,
                    redirectUrl: configuration.redirectUri,
                    scopes: configuration.scope.split(' '),
                    serviceConfiguration: {
                        authorizationEndpoint:
                            configuration.authorizationEndpoint,
                        tokenEndpoint: configuration.tokenEndpoint
                    },
                    additionalParameters: expect.objectContaining({
                        prompt: 'create'
                    }),
                    skipCodeExchange: true,
                    usePKCE: true
                })
            );
        });

        test('[RNStorage] Logout', async () => {
            await globalClient.logout();
            // We don't have an idToken in storage by default here, so logout falls back to opening the logout URL.
            const { Linking } = require('react-native');
            expect(Linking.openURL).toHaveBeenCalledWith(
                `${configuration.logoutEndpoint}?${new URLSearchParams({
                    redirect: configuration.logoutRedirectUri
                }).toString()}`
            );
        });

        test('[RNStorage] User logged out', async () => {
            // Even if we have an idToken, we still use Kinde's /logout to clear the Kinde server session.
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify({
                    ...fakeTokenResponse,
                    id_token: 'this_is_id_token'
                })
            });

            const rs = await globalClient.logout();
            expect(rs).toEqual(true);

            const { Linking } = require('react-native');
            expect(Linking.openURL).toHaveBeenCalledWith(
                `${configuration.logoutEndpoint}?${new URLSearchParams({
                    redirect: configuration.logoutRedirectUri
                }).toString()}`
            );
        });

        test.each([
            [
                '[RNStorage] Logout returns false when URL cannot be opened',
                'resolves-false'
            ],
            [
                '[RNStorage] Logout handles canOpenURL rejection gracefully',
                'rejects'
            ]
        ])('%s', async (_name, scenario) => {
            const { Linking } = require('react-native');
            if (scenario === 'rejects') {
                // Simulate canOpenURL throwing an error
                Linking.canOpenURL = jest
                    .fn()
                    .mockRejectedValue(new Error('URL scheme not supported'));
            } else {
                // Simulate canOpenURL returning false (URL cannot be opened)
                Linking.canOpenURL = jest.fn().mockResolvedValue(false);
            }
            const rs = await globalClient.logout();
            expect(rs).toEqual(false);
        });

        test('[RNStorage] Create Organization', async () => {
            authorize.mockResolvedValue({
                authorizationCode: 'random_code',
                codeVerifier: configuration.fakeCodeVerifier
            });
            await globalClient.createOrg();

            expect(authorize).toHaveBeenCalledWith(
                expect.objectContaining({
                    additionalParameters: expect.objectContaining({
                        prompt: 'create',
                        is_create_org: 'true'
                    })
                })
            );
        });

        test('[RNStorage] Received token from login', async () => {
            authorize.mockResolvedValue({
                authorizationCode: 'random_code',
                codeVerifier: configuration.fakeCodeVerifier
            });
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });

            const token = await globalClient.login();
            expect(token).toEqual({
                access_token: 'this_is_access_token',
                refresh_token: 'this_is_refresh_token',
                id_token: 'this_is_id_token',
                scope: 'this_is_scope',
                token_type: 'this_is_token_type',
                expires_in: 86400
            });
        });

        test.each([
            ['user_cancelled', '[RNStorage] Dismiss web browser'],
            [
                'org.openid.appauth.general error -3',
                '[RNStorage] Cancel web browser (iOS AppAuth)'
            ]
        ])('%s: %s', async (errorMessage) => {
            authorize.mockRejectedValue(new Error(errorMessage));
            const token = await globalClient.login();
            expect(token).toEqual(null);
        });

        test('Logout Revoke Token', async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    json: () => Promise.resolve(fakeTokenResponse)
                })
            );

            const rs = await globalClient.logout(true);

            expect(rs).toEqual(true);
        });
    });

    describe('Token', () => {
        test('Check not authenticated', async () => {
            const authenticated = await globalClient.isAuthenticated;
            expect(authenticated).toEqual(false);
        });

        test('Get Token instance without URL', async () => {
            let throwErr = null;

            try {
                await globalClient.getToken();
            } catch (error) {
                throwErr = error;
            }
            expect(throwErr?.message).toEqual('URL cannot be empty');
        });

        test('Get Token instance got an error from Kinde response', async () => {
            let throwErr = null;
            try {
                await globalClient.getToken(
                    `${configuration.redirectUri}?code=random_code&error=random_error&error_description=invalid`
                );
            } catch (error) {
                throwErr = error;
            }
            expect(throwErr?.message).toEqual('invalid');
        });

        test('Get Token instance', async () => {
            const token = await globalClient.getToken(
                `${configuration.redirectUri}?code=random_code`
            );
            expect(token).toEqual({
                access_token: 'this_is_access_token',
                refresh_token: 'this_is_refresh_token',
                id_token: 'this_is_id_token',
                scope: 'this_is_scope',
                token_type: 'this_is_token_type',
                expires_in: 86400
            });
        });
        test('[RNStorage] Check authenticated in the case access_token still valid ', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });

            const authenticated = await globalClient.isAuthenticated;
            expect(authenticated).toEqual(true);
        });

        test('[RNStorage] Check authenticated use refresh_token', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify({
                    ...fakeTokenResponse,
                    access_token: '',
                    expires_in: 0
                })
            });

            const authenticated = await globalClient.isAuthenticated;
            expect(authenticated).toEqual(true);
        });

        test('[RNStorage] Get Token instance when user is authenticated', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify({
                    ...fakeTokenResponse
                })
            });
            const token = await globalClient.getToken();
            expect(token).toEqual({
                access_token: 'this_is_access_token',
                refresh_token: 'this_is_refresh_token',
                id_token: 'this_is_id_token',
                scope: 'this_is_scope',
                token_type: 'this_is_token_type',
                expires_in: 86400
            });
        });
    });

    describe('Payload', () => {
        test('[RNStorage] Get claim via access token', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });

            expect((await globalClient.getClaim('iss')).value).toBe(
                fakePayloadFromDecodeToken.iss
            );
            expect((await globalClient.getClaim('iss')).name).toBe('iss');
        });

        test('[RNStorage] Get claim via id token', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });

            expect((await globalClient.getClaim('azp', 'id_token')).value).toBe(
                fakePayloadFromDecodeToken.azp
            );

            expect((await globalClient.getClaim('azp', 'id_token')).name).toBe(
                'azp'
            );
        });

        test('[RNStorage] Get permissions', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });
            expect(await globalClient.getPermissions()).toEqual({
                orgCode: fakePayloadFromDecodeToken.org_code,
                permissions: fakePayloadFromDecodeToken.permissions
            });
        });

        test('[RNStorage] Get existed permission', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });
            expect(await globalClient.getPermission('read:profile')).toEqual({
                orgCode: fakePayloadFromDecodeToken.org_code,
                isGranted: true
            });
        });

        test('[RNStorage] Get non-existed permission', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });
            expect(await globalClient.getPermission('write:profile')).toEqual({
                orgCode: fakePayloadFromDecodeToken.org_code,
                isGranted: false
            });
        });

        test('[RNStorage] Get organization', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });
            expect(await globalClient.getOrganization()).toEqual({
                orgCode: fakePayloadFromDecodeToken.org_code
            });
        });

        test('[RNStorage] Get organizations', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });
            expect(await globalClient.getUserOrganizations()).toEqual({
                orgCodes: fakePayloadFromDecodeToken.org_codes
            });
        });

        test('[RNStorage] Get User Details', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });
            expect(await globalClient.getUserDetails()).toEqual(fakeUserDetail);
        });
    });

    describe('Get Boolean Flag', () => {
        test('[RNStorage] Get Value', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });

            expect(
                await globalClient.getBooleanFlag('is_dark_mode', true)
            ).toEqual(true);
        });

        test('[RNStorage] Throw an error in the case no default value provided', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });

            await expect(
                globalClient.getBooleanFlag('is_dark_mode')
            ).rejects.toThrow(
                "This flag 'is_dark_mode' was not found, and no default value has been provided"
            );
        });
    });

    describe('Get Integer Flag', () => {
        test('[RNStorage] Get Value', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });

            expect(await globalClient.getIntegerFlag('limit', 1)).toEqual(1);
        });

        test('[RNStorage] Throw an error in the case no default value provided', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });

            await expect(globalClient.getIntegerFlag('limit')).rejects.toThrow(
                "This flag 'limit' was not found, and no default value has been provided"
            );
        });
    });

    describe('Get String Flag', () => {
        test('[RNStorage] Get Value', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });

            expect(await globalClient.getStringFlag('theme', 'blue')).toEqual(
                'blue'
            );
        });

        test('[RNStorage] Throw an error in the case no default value provided', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });

            await expect(globalClient.getStringFlag('theme')).rejects.toThrow(
                "This flag 'theme' was not found, and no default value has been provided"
            );
        });
    });

    describe('forceTokenRefresh', () => {
        test(`[RNStorage] Throws an error if no refresh token found in storage`, async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify({ refresh_token: undefined })
            });
            await expect(globalClient.forceTokenRefresh()).rejects.toThrow(
                'No refresh token available to perform token refresh.'
            );
        });

        test('[RNStorage] Stores newly fetched tokens in storage', async () => {
            let storage = {
                username: 'kinde',
                password: JSON.stringify(fakeTokenResponse)
            };
            RNStorage.prototype.getItem = jest.fn(() => storage);
            RNStorage.prototype.setItem = jest.fn((value: unknown) => {
                storage.password = JSON.stringify(value);
            });

            const formData = new FormData();
            const { refresh_token } = JSON.parse(storage.password);
            formData.append('client_id', configuration.clientId);
            formData.append('grant_type', 'refresh_token');
            formData.append('refresh_token', refresh_token);

            const newTokensResponse = {
                ...fakeTokenResponse,
                access_token: 'this_is_new_access_token',
                refresh_token: 'this_is_new_refresh_token',
                id_token: 'this_is_new_id_token'
            };
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    json: () => Promise.resolve(newTokensResponse)
                })
            );

            await globalClient.forceTokenRefresh();
            expect(global.fetch).toHaveBeenCalled();
            expect(global.fetch.mock.calls[0][1].body).toEqual(formData);
            expect(storage.password).toBe(JSON.stringify(newTokensResponse));
        });

        test(`[RNStorage] returns "null" in the event network call rejects`, async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    json: () => Promise.resolve({ error: 'error' })
                })
            );

            const response = await globalClient.forceTokenRefresh();
            expect(response).toBe(null);
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    describe('AuthBrowserOptions Deprecation Warnings', () => {
        const {
            warnDeprecatedAuthBrowserOptions,
            resetDeprecationWarningState,
            DEPRECATED_AUTH_BROWSER_OPTIONS
        } = require('../src/types/Auth');

        const originalDev = (global as { __DEV__: boolean }).__DEV__;

        beforeEach(() => {
            resetDeprecationWarningState();
            jest.spyOn(console, 'warn').mockImplementation(() => {});
            // Ensure we're in development mode for most tests
            (global as { __DEV__: boolean }).__DEV__ = true;
        });

        afterEach(() => {
            jest.restoreAllMocks();
            (global as { __DEV__: boolean }).__DEV__ = originalDev;
        });

        test('should not warn when no options are provided', () => {
            warnDeprecatedAuthBrowserOptions(undefined);
            expect(console.warn).not.toHaveBeenCalled();
        });

        test('should not warn in production mode (__DEV__ = false)', () => {
            (global as { __DEV__: boolean }).__DEV__ = false;
            warnDeprecatedAuthBrowserOptions({
                ephemeralWebSession: true,
                showTitle: true
            });
            expect(console.warn).not.toHaveBeenCalled();
        });

        test('should not warn when only active options are used', () => {
            warnDeprecatedAuthBrowserOptions({
                iosPrefersEphemeralSession: true,
                iosCustomBrowser: 'safari',
                androidAllowCustomBrowsers: ['chrome']
            });
            expect(console.warn).not.toHaveBeenCalled();
        });

        test('should warn when ephemeralWebSession is used without iosPrefersEphemeralSession', () => {
            warnDeprecatedAuthBrowserOptions({
                ephemeralWebSession: true
            });
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('ephemeralWebSession')
            );
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('iosPrefersEphemeralSession')
            );
        });

        test('should not warn about ephemeralWebSession when iosPrefersEphemeralSession is also set', () => {
            warnDeprecatedAuthBrowserOptions({
                ephemeralWebSession: true,
                iosPrefersEphemeralSession: true
            });
            // Should not warn about ephemeralWebSession specifically
            const calls = (console.warn as jest.Mock).mock.calls;
            const ephemeralSpecificWarning = calls.find(
                (call) =>
                    call[0].includes('ephemeralWebSession') &&
                    call[0].includes('Use `iosPrefersEphemeralSession`')
            );
            expect(ephemeralSpecificWarning).toBeUndefined();
        });

        test('should warn when deprecated options are used', () => {
            warnDeprecatedAuthBrowserOptions({
                showTitle: true,
                toolbarColor: '#ffffff'
            });
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('showTitle')
            );
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('toolbarColor')
            );
        });

        test('should only warn once per session for deprecated options', () => {
            warnDeprecatedAuthBrowserOptions({ showTitle: true });
            warnDeprecatedAuthBrowserOptions({ toolbarColor: '#fff' });

            // Count warnings about deprecated options (not ephemeralWebSession)
            const deprecatedWarnings = (
                console.warn as jest.Mock
            ).mock.calls.filter((call) => call[0].includes('will be ignored'));
            expect(deprecatedWarnings.length).toBe(1);
        });

        test('should only warn once per session for ephemeralWebSession', () => {
            warnDeprecatedAuthBrowserOptions({ ephemeralWebSession: true });
            warnDeprecatedAuthBrowserOptions({ ephemeralWebSession: true });

            // Count ephemeralWebSession warnings
            const ephemeralWarnings = (
                console.warn as jest.Mock
            ).mock.calls.filter((call) =>
                call[0].includes('Use `iosPrefersEphemeralSession`')
            );
            expect(ephemeralWarnings.length).toBe(1);
        });

        test('ephemeral and deprecated warnings use separate flags', () => {
            // First call with ephemeralWebSession
            warnDeprecatedAuthBrowserOptions({ ephemeralWebSession: true });
            // Second call with deprecated option
            warnDeprecatedAuthBrowserOptions({ showTitle: true });

            // Should have both warnings (separate flags)
            const ephemeralWarnings = (
                console.warn as jest.Mock
            ).mock.calls.filter((call) =>
                call[0].includes('Use `iosPrefersEphemeralSession`')
            );
            const deprecatedWarnings = (
                console.warn as jest.Mock
            ).mock.calls.filter((call) => call[0].includes('will be ignored'));

            expect(ephemeralWarnings.length).toBe(1);
            expect(deprecatedWarnings.length).toBe(1);
        });

        test('DEPRECATED_AUTH_BROWSER_OPTIONS should contain expected keys', () => {
            expect(DEPRECATED_AUTH_BROWSER_OPTIONS).toContain('animated');
            expect(DEPRECATED_AUTH_BROWSER_OPTIONS).toContain('showTitle');
            expect(DEPRECATED_AUTH_BROWSER_OPTIONS).toContain('toolbarColor');
            expect(DEPRECATED_AUTH_BROWSER_OPTIONS).toContain(
                'modalPresentationStyle'
            );
            expect(DEPRECATED_AUTH_BROWSER_OPTIONS).not.toContain(
                'iosPrefersEphemeralSession'
            );
            expect(DEPRECATED_AUTH_BROWSER_OPTIONS).not.toContain(
                'ephemeralWebSession'
            );
        });
    });
});
