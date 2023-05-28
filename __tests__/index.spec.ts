// @ts-nocheck

const { KindeSDK } = require(process.cwd() + '/src/index');
import jwtDecode from 'jwt-decode';
import Url from 'url-parse';
import RNStorage from '../src/SDK/Storage/RNStorage';
import ExpoStorage from '../src/SDK/Storage/ExpoStorage';
import Constants from 'expo-constants';
import { Linking } from 'react-native';

const fakeTokenResponse = {
    access_token: 'this_is_access_token',
    refresh_token: 'this_is_refresh_token',
    id_token: 'this_is_id_token',
    scope: 'this_is_scope',
    token_type: 'this_is_token_type',
    expires_in: 86400 // 1 day
};

function FormDataMock() {
    this.append = jest.fn();
}

jest.mock('react-native', () => {
    return {
        Linking: {
            openURL: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        }
    };
});

jest.mock('react-native-keychain', () => {
    return {
        setGenericPassword: jest.fn().mockResolvedValue(),
        getGenericPassword: jest.fn().mockResolvedValue(),
        resetGenericPassword: jest.fn().mockResolvedValue()
    };
});

jest.mock('expo-constants', () => {
    return {
        executionEnvironment: 'test',
        ExecutionEnvironment: {
            Bare: 'bare',
            Standalone: 'standalone',
            StoreClient: 'storeClient'
        }
    };
});

jest.mock('expo-secure-store', () => {
    return {
        getItemAsync: jest.fn().mockResolvedValue(),
        setItemAsync: jest.fn().mockResolvedValue()
    };
});

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
    generateChallenge: jest.fn().mockReturnValue({
        state: 'uUj8nEDL-jxeDbS_si86i7UsFmG5ewf0axDu96pdHGc',
        codeVerifier: 'K9E0HqVA4oxGuJqFWoasgmGKzI3Uxehdr9nTF2jaLR8',
        codeChallenge: '3Aqg8_tu8aNwnxPmhE1b1ONsThy-b6hppET0knva9Kc'
    }),
    generateRandomString: jest
        .fn()
        .mockReturnValue('uUj8nEDL-jxeDbS_si86i7UsFmG5ewf0axDu96pdHGc'),
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
    })
}));

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
        Constants.executionEnvironment = 'test';

        RNStorage.prototype.getItem = jest
            .fn()
            .mockReturnValue({ password: null });

        RNStorage.prototype.setItem = jest.fn();

        ExpoStorage.prototype.getItem = jest
            .fn()
            .mockReturnValue({ password: null });

        ExpoStorage.prototype.setItem = jest.fn();

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
        test('Open authenticate endpoint', async () => {
            await globalClient.login();
            const URLParsed = Url(`${configuration.issuer}/oauth2/auth`, true);
            URLParsed.query['client_id'] = configuration.clientId;
            URLParsed.query['redirect_uri'] = configuration.redirectUri;
            URLParsed.query['client_secret'] = configuration.clientSecret;
            URLParsed.query['grant_type'] = 'authorization_code';
            URLParsed.query['scope'] = configuration.scope;
            URLParsed.query['start_page'] = 'login';
            URLParsed.query['response_type'] = 'code';
            URLParsed.query['state'] = configuration.fakeState;
            URLParsed.query['code_challenge'] = configuration.fakeCodeChallenge;
            URLParsed.query['code_challenge_method'] = 'S256';
            expect(Linking.openURL).toHaveBeenCalledWith(URLParsed.toString());
        });

        test('Open registration endpoint', async () => {
            await globalClient.register();
            const URLParsed = Url(configuration.authorizationEndpoint, true);
            URLParsed.query['client_id'] = configuration.clientId;
            URLParsed.query['redirect_uri'] = configuration.redirectUri;
            URLParsed.query['client_secret'] = configuration.clientSecret;
            URLParsed.query['grant_type'] = 'authorization_code';
            URLParsed.query['scope'] = configuration.scope;
            URLParsed.query['start_page'] = 'registration';
            URLParsed.query['response_type'] = 'code';
            URLParsed.query['state'] = configuration.fakeState;
            URLParsed.query['code_challenge'] = configuration.fakeCodeChallenge;
            URLParsed.query['code_challenge_method'] = 'S256';
            expect(Linking.openURL).toHaveBeenCalledWith(URLParsed.toString());
        });

        test('Logout', async () => {
            await globalClient.logout();
            const URLParsed = Url(configuration.logoutEndpoint, true);
            URLParsed.query['redirect'] = configuration.logoutRedirectUri;
            expect(Linking.openURL).toHaveBeenCalledWith(URLParsed.toString());
        });

        test('Create Organization', async () => {
            await globalClient.createOrg();
            const URLParsed = Url(configuration.authorizationEndpoint, true);
            URLParsed.query['client_id'] = configuration.clientId;
            URLParsed.query['redirect_uri'] = configuration.redirectUri;
            URLParsed.query['client_secret'] = configuration.clientSecret;
            URLParsed.query['grant_type'] = 'authorization_code';
            URLParsed.query['scope'] = configuration.scope;
            URLParsed.query['start_page'] = 'registration';
            URLParsed.query['response_type'] = 'code';
            URLParsed.query['state'] = configuration.fakeState;
            URLParsed.query['is_create_org'] = true;
            URLParsed.query['code_challenge'] = configuration.fakeCodeChallenge;
            URLParsed.query['code_challenge_method'] = 'S256';
            expect(Linking.openURL).toHaveBeenCalledWith(URLParsed.toString());
        });
    });

    describe('Token', () => {
        test('[RNStorage] Check authenticated in the case access_token still valid ', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });

            const authenticated = await globalClient.isAuthenticated;
            expect(authenticated).toEqual(true);
        });

        test('[ExpoStorage] Check authenticated in the case access_token still valid ', async () => {
            Constants.executionEnvironment = 'storeClient';

            ExpoStorage.prototype.getItem = jest
                .fn()
                .mockReturnValue(JSON.stringify(fakeTokenResponse));

            const authenticated = await globalClient.isAuthenticated;
            expect(authenticated).toEqual(true);
        });

        test('RNStorage] Check authenticated use refresh_token', async () => {
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

        test('[ExpoStorage] Check authenticated use refresh_token', async () => {
            Constants.executionEnvironment = 'storeClient';

            ExpoStorage.prototype.getItem = jest.fn().mockReturnValue(
                JSON.stringify({
                    ...fakeTokenResponse,
                    access_token: '',
                    expires_in: 0
                })
            );

            const authenticated = await globalClient.isAuthenticated;
            expect(authenticated).toEqual(true);
        });

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

        test('[ExpoStorage] Get Token instance when user is authenticated', async () => {
            Constants.executionEnvironment = 'storeClient';

            ExpoStorage.prototype.getItem = jest.fn().mockReturnValue({
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
            expect(await globalClient.getClaim('iss')).toBe(
                fakePayloadFromDecodeToken.iss
            );
        });

        test('[ExpoStorage] Get claim via access token', async () => {
            Constants.executionEnvironment = 'storeClient';

            ExpoStorage.prototype.getItem = jest
                .fn()
                .mockReturnValue(JSON.stringify(fakeTokenResponse));
            expect(await globalClient.getClaim('iss')).toBe(
                fakePayloadFromDecodeToken.iss
            );
        });

        test('[RNStorage] Get claim via id token', async () => {
            RNStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });
            expect(await globalClient.getClaim('azp', 'id_token')).toBe(
                fakePayloadFromDecodeToken.azp
            );
        });

        test('[ExpoStorage] Get claim via id token', async () => {
            Constants.executionEnvironment = 'storeClient';
            ExpoStorage.prototype.getItem = jest
                .fn()
                .mockReturnValue(JSON.stringify(fakeTokenResponse));
            expect(await globalClient.getClaim('azp', 'id_token')).toBe(
                fakePayloadFromDecodeToken.azp
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

        test('[ExpoStorage] Get permissions', async () => {
            Constants.executionEnvironment = 'storeClient';
            ExpoStorage.prototype.getItem = jest.fn().mockReturnValue({
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

        test('[ExpoStorage] Get existed permission', async () => {
            Constants.executionEnvironment = 'storeClient';
            ExpoStorage.prototype.getItem = jest.fn().mockReturnValue({
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

        test('[ExpoStorage] Get non-existed permission', async () => {
            Constants.executionEnvironment = 'storeClient';
            ExpoStorage.prototype.getItem = jest.fn().mockReturnValue({
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

        test('[ExpoStorage] Get organization', async () => {
            Constants.executionEnvironment = 'storeClient';
            ExpoStorage.prototype.getItem = jest.fn().mockReturnValue({
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

        test('[ExpoStorage] Get organizations', async () => {
            Constants.executionEnvironment = 'storeClient';
            ExpoStorage.prototype.getItem = jest.fn().mockReturnValue({
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

        test('[ExpoStorage] Get User Details', async () => {
            Constants.executionEnvironment = 'storeClient';
            ExpoStorage.prototype.getItem = jest.fn().mockReturnValue({
                password: JSON.stringify(fakeTokenResponse)
            });
            expect(await globalClient.getUserDetails()).toEqual(fakeUserDetail);
        });
    });
});
