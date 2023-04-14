// @ts-nocheck
const { KindeSDK, ApiClient, OAuthApi } = require(process.cwd() + '/src/index');
import { Linking } from 'react-native';
import Url from 'url-parse';
import BaseStore from '../src/SDK/Storage/Base';
import RNStorage from '../src/SDK/Storage/RNStorage';

BaseStore.prototype.getItem = jest
    .fn()
    .mockReturnValue(
        '{"email": "usertesting@yopmail.com", "family_name": "user", "given_name": "test", "id": "kp:58ece9f68a7c4c098efc1cf45c774e16"}'
    );
BaseStore.prototype.setItem = jest.fn();

const fakeTokenResponse = {
    access_token: 'this_is_access_token',
    refresh_token: 'this_is_refresh_token',
    id_token: 'this_is_id_token',
    scope: 'this_is_scope',
    token_type: 'this_is_token_type',
    expires_in: 86400 // 1 day
};

RNStorage.prototype.getItem = jest
    .fn()
    .mockReturnValue({ password: JSON.stringify(fakeTokenResponse) });

RNStorage.prototype.setItem = jest.fn();

global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve(fakeTokenResponse)
    })
);

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
        ExecutionEnvironment: jest.fn().mockResolvedValue()
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

const fakeUserProfile = {
    id: 'kp:58ece9f68a7c4c098efc1cf45c774e16',
    last_name: 'test',
    first_name: 'user',
    provided_id: null,
    preferred_email: 'usertesting@yopmail.com'
};

const fakeUserDetail = {
    id: 'kp:58ece9f68a7c4c098efc1cf45c774e16',
    given_name: 'test',
    family_name: 'user',
    email: 'usertesting@yopmail.com'
};

const fakePayloadFromDecodeToken = {
    azp: 'test@live',
    iss: 'https://myhost.kinde.com',
    org_code: 'org_e5f28e1676d',
    org_codes: ['org_e5f28e1676d'],
    permissions: ['read:profile', 'read:email']
};

const getValueByKey = (obj: Record<string, any>, key: string) => obj[key];

// jest.mock('Linking', () => ({
//     openURL: jest.fn(),
//     addEventListener: jest.fn(),
//     removeEventListener: jest.fn()
// }));

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

jest.mock('jwt-decode', () =>
    jest.fn().mockReturnValue({
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
    })
);

let globalClient;
describe('KindeSDK', () => {
    beforeAll(() => {
        globalClient = new KindeSDK(
            configuration.issuer,
            configuration.redirectUri,
            configuration.clientId,
            configuration.logoutRedirectUri
        );
    });
    beforeEach(() => {
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
        test('Check isAuthenticated after login', async () => {
            await globalClient.login();
            await globalClient.getToken(
                `${configuration.redirectUri}?code=random_code`
            );
            const authenticated = await globalClient.isAuthenticated;
            expect(authenticated).toEqual(true);
        });
        test('Check Auth Status Initial', async () => {
            const client = new KindeSDK(
                configuration.issuer,
                configuration.redirectUri,
                configuration.clientId,
                configuration.logoutRedirectUri
            );
            expect(client.authStatus).toEqual('UNAUTHENTICATED');
        });
        test('Check Auth Status before login', async () => {
            await globalClient.login();
            expect(globalClient.authStatus).toEqual('AUTHENTICATING');
        });
        test('Check Auth Status after login', async () => {
            await globalClient.login();
            await globalClient.getToken(
                `${configuration.redirectUri}?code=random_code`
            );
            const timeExpired = new Date().getTime() + 1000 * 60 * 60; // 1 hour
            BaseStore.prototype.getItem = jest
                .fn()
                .mockReturnValue(timeExpired);

            expect(globalClient.authStatus).toEqual('AUTHENTICATED');
        });
        test('Check Auth Status after logout', async () => {
            await globalClient.logout();
            expect(globalClient.authStatus).toEqual('UNAUTHENTICATED');
        });
    });
    describe('Token', () => {
        test('Get Token instance', async () => {
            await globalClient.login();
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
            expect(fetch).toHaveBeenCalledTimes(1);
        });
    });
    describe('Api', () => {
        test('Get user profile', async () => {
            const config = new ApiClient.Configuration({
                basePath: configuration.issuer
            });
            const apiInstance = new OAuthApi(config);
            jest.spyOn(apiInstance, 'getUserProfileV2').mockImplementation(
                () => {
                    return {
                        id: 'kp:58ece9f68a7c4c098efc1cf45c774e16',
                        last_name: 'test',
                        first_name: 'user',
                        provided_id: null,
                        preferred_email: 'usertesting@yopmail.com'
                    };
                }
            );
            const data = await apiInstance.getUserProfileV2();
            await expect(data).toEqual(fakeUserProfile);
        });
    });
    describe('Payload', () => {
        test('Get claim via access token', async () => {
            expect(await globalClient.getClaim('iss')).toBe(
                fakePayloadFromDecodeToken.iss
            );
        });
        test('Get claim via id token', async () => {
            expect(await globalClient.getClaim('azp', 'id_token')).toBe(
                fakePayloadFromDecodeToken.azp
            );
        });
        test('Get permissions', async () => {
            expect(await globalClient.getPermissions()).toEqual({
                orgCode: fakePayloadFromDecodeToken.org_code,
                permissions: fakePayloadFromDecodeToken.permissions
            });
        });
        test('Get existed permission', async () => {
            expect(await globalClient.getPermission('read:profile')).toEqual({
                orgCode: fakePayloadFromDecodeToken.org_code,
                isGranted: true
            });
        });
        test('Get non-existed permission', async () => {
            expect(await globalClient.getPermission('write:profile')).toEqual({
                orgCode: fakePayloadFromDecodeToken.org_code,
                isGranted: false
            });
        });
        test('Get organization', async () => {
            expect(await globalClient.getOrganization()).toEqual({
                orgCode: fakePayloadFromDecodeToken.org_code
            });
        });
        test('Get organizations', async () => {
            expect(await globalClient.getUserOrganizations()).toEqual({
                orgCodes: fakePayloadFromDecodeToken.org_codes
            });
        });
        test('Get User Details', async () => {
            BaseStore.prototype.getItem = jest
                .fn()
                .mockReturnValue(
                    '{"email": "usertesting@yopmail.com", "family_name": "user", "given_name": "test", "id": "kp:58ece9f68a7c4c098efc1cf45c774e16"}'
                );
            expect(await globalClient.getUserDetails()).toEqual(fakeUserDetail);
        });
    });
});
