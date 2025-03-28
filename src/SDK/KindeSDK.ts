import jwt_decode from 'jwt-decode';
import Url from 'url-parse';
import { UnAuthenticatedException } from '../common/exceptions/unauthenticated.exception';
import { UnexpectedException } from '../common/exceptions/unexpected.exception';
import {
    AdditionalParameters,
    FeatureFlag,
    OptionalFlag,
    OrgAdditionalParams,
    RegisterAdditionalParameters,
    TokenResponse
} from '../types/KindeSDK';
import { TokenType } from './Enums';
import AuthorizationCode from './OAuth/AuthorizationCode';
import Storage from './Storage';
import {
    checkAdditionalParameters,
    checkNotNull,
    convertObject2FormData,
    openWebBrowser
} from './Utils';
import * as runtime from '../ApiClient';
import { FLAG_TYPE } from './constants';
import { AuthBrowserOptions } from '../types/Auth';
import { LoginMethodParams } from '@kinde/js-utils';
import { version } from '../../package.json';

class KindeSDK extends runtime.BaseAPI {
    public issuer: string;
    public redirectUri: string;
    public clientId: string;
    public logoutRedirectUri: string;
    public scope: string;
    public additionalParameters: Pick<
        Partial<LoginMethodParams> | AdditionalParameters,
        'audience'
    >;
    public authBrowserOptions?: AuthBrowserOptions;

    /**
     * The constructor function takes in a bunch of parameters and sets them to the class properties
     * @param {string} issuer - The URL of the OIDC provider.
     * @param {string} redirectUri - The URI that the OIDC provider will redirect to after the user has
     * logged in.
     * @param {string} clientId - The client ID of your application.
     * @param {string} logoutRedirectUri - The URL to redirect to after logout.
     * @param {string} [scope=openid profile email offline] - The scope of the authentication. This is
     * a space-separated list of scopes.
     * @param {Omit<Partial<LoginMethodParams> | AdditionalParameters, 'audience'>} additionalParameters - AdditionalParameters = {}
     * @param {AuthBrowserOptions} [authBrowserOptions] - Authentication browser options.
     */
    constructor(
        issuer: string,
        redirectUri: string,
        clientId: string,
        logoutRedirectUri: string,
        scope: string = 'openid profile email offline',
        additionalParameters: Omit<
            Partial<LoginMethodParams> | AdditionalParameters,
            'audience'
        > = {},
        authBrowserOptions?: AuthBrowserOptions
    ) {
        const configuration = new runtime.Configuration({
            basePath: issuer
        });

        super(configuration);

        this.issuer = issuer;
        checkNotNull(this.issuer, 'Issuer');

        this.redirectUri = redirectUri;
        checkNotNull(this.redirectUri, 'Redirect URI');

        this.clientId = clientId;
        checkNotNull(this.clientId, 'Client Id');

        this.logoutRedirectUri = logoutRedirectUri;
        checkNotNull(this.logoutRedirectUri, 'Logout Redirect URI');

        this.additionalParameters =
            checkAdditionalParameters(additionalParameters);

        this.scope = scope;

        this.authBrowserOptions = authBrowserOptions;
    }

    /**
     * The function takes an object as an argument, and if the object is empty, it will use the default
     * object
     * @param {AdditionalParameters} additionalParameters - LoginAdditionalParameters = {}
     * @param {AuthBrowserOptions} [authBrowserOptions] - Authentication browser options.
     * @returns A promise that resolves to void.
     */
    async login(
        additionalParameters:
            | Partial<LoginMethodParams>
            | AdditionalParameters = {},
        authBrowserOptions?: AuthBrowserOptions
    ): Promise<TokenResponse | null> {
        checkAdditionalParameters(additionalParameters);
        await this.cleanUp();
        const auth = new AuthorizationCode();
        const additionalParametersMerged = {
            ...this.additionalParameters,
            ...additionalParameters
        };
        return auth.authenticate(
            this,
            'login',
            additionalParametersMerged,
            authBrowserOptions
        );
    }

    /**
     * The `register` function is an asynchronous function that registers a user by authenticating
     * their authorization code and additional parameters.
     * @param {OrgAdditionalParams} additionalParameters - The `additionalParameters` parameter is an
     * optional object that can contain additional parameters for the registration process. It is of
     * type `RegisterAdditionalParameters`, which is a custom type that you may have defined elsewhere in your
     * code.
     * @param {AuthBrowserOptions} [authBrowserOptions] - Authentication browser options.
     * @returns a Promise that resolves to either a TokenResponse object or null.
     */
    async register(
        additionalParameters:
            | Partial<LoginMethodParams>
            | RegisterAdditionalParameters = {},
        authBrowserOptions?: AuthBrowserOptions
    ): Promise<TokenResponse | null> {
        checkAdditionalParameters(additionalParameters);
        await this.cleanUp();

        const auth = new AuthorizationCode();
        const additionalParametersMerged = {
            ...this.additionalParameters,
            ...additionalParameters
        };

        return auth.authenticate(
            this,
            'registration',
            additionalParametersMerged,
            authBrowserOptions
        );
    }

    /**
     * This function creates an organization with additional parameters.
     * @param additionalParameters
     * @param {AuthBrowserOptions} [authBrowserOptions] - Authentication browser options.
     * @returns A promise that resolves to void.
     */
    createOrg(
        additionalParameters:
            | Omit<Partial<LoginMethodParams>, 'isCreateOrg'>
            | Omit<OrgAdditionalParams, 'is_create_org'> = {},
        authBrowserOptions?: AuthBrowserOptions
    ) {
        return this.register(
            { isCreateOrg: true, ...additionalParameters },
            authBrowserOptions
        );
    }

    /**
     * The `logout` function is an asynchronous function that performs cleanup tasks and then either
     * revokes the user's authorization or redirects them to a logout endpoint.
     * @param [isRevoke=false] - A boolean value indicating whether the logout should also revoke the
     * user's authorization.
     * @param {AuthBrowserOptions} [authBrowserOptions] - Authentication browser options.
     * @returns a boolean value. If the `isRevoke` parameter is `true`, it returns `true` if the revoke
     * request is successful, and `false` if there is an error. If the `isRevoke` parameter is `false`,
     * it returns `true` if the logout redirect is successful, and `false` if there is an error.
     */
    async logout(isRevoke = false, authBrowserOptions?: AuthBrowserOptions) {
        await this.cleanUp();

        if (isRevoke) {
            const payload = new URLSearchParams({
                client_id: this.clientId,
                redirect_uri: this.redirectUri,
                scope: this.scope,
                grant_type: 'authorization_code'
            });

            try {
                await this.request({
                    path: `/oauth2/revoke`,
                    method: 'POST',
                    headers: {},
                    body: convertObject2FormData(payload)
                });
                return true;
            } catch (error: any) {
                console.error(
                    'Something went wrong when trying to revoke token',
                    error.message
                );
                return false;
            }
        }

        const URLParsed = Url(this.logoutEndpoint, true);
        URLParsed.query['redirect'] = this.logoutRedirectUri;
        const response = await openWebBrowser(
            URLParsed.toString(),
            this.redirectUri,
            authBrowserOptions || this.authBrowserOptions
        );
        return response.type === 'success';
    }

    /**
     * This function retrieves a token from a given URL using authorization code grant type and checks
     * for validity before doing so.
     * @param {string} [url] - The URL to fetch the token from. It is an optional parameter with a
     * default value of an empty string.
     * @returns The function `getToken` is returning a Promise that resolves to a `TokenResponse`
     * object.
     */
    async getToken(url?: string): Promise<TokenResponse> {
        // Checking for case token still valid or not
        try {
            if (await this.isAuthenticated) {
                const token = await Storage.getToken();
                return token!;
            }
        } catch (_) {}

        checkNotNull(url, 'URL');

        const URLParsed = new Url(url!, true);
        const {
            code,
            error,
            error_description: errorDescription
        } = URLParsed.query;

        if (error) {
            const msg = errorDescription ?? error;
            throw new UnAuthenticatedException(msg);
        }
        checkNotNull(code, 'code');

        const formData = new FormData();
        formData.append('code', code);
        formData.append('client_id', this.clientId);
        formData.append('grant_type', 'authorization_code');
        formData.append('redirect_uri', this.redirectUri);

        const state = Storage.getState();
        if (state) {
            formData.append('state', state);
        }
        const codeVerifier = Storage.getCodeVerifier();
        if (codeVerifier) {
            formData.append('code_verifier', codeVerifier);
        }

        return this.fetchToken(formData);
    }

    /**
     * This function refreshes an access token using a refresh token.
     * @param {string} [refreshToken] - The refresh token value.
     * @returns The `useRefreshToken` function is returning the result of calling the `fetchToken`
     * function with a `FormData` object containing the necessary parameters for refreshing an access
     * token.
     */
    async useRefreshToken(refreshToken: string) {
        const formData = new FormData();
        formData.append('client_id', this.clientId);
        formData.append('grant_type', 'refresh_token');
        formData.append('refresh_token', refreshToken);
        return this.fetchToken(formData);
    }

    /**
     * This function refreshes the access token using the current refresh token
     * in storage and updates the storage with new tokens.
     * @returns A Promise that resolves to `TokenResponse` if attempted refresh
     * succeeds or `null` in the event the attempted token refresh fails.
     */
    async forceTokenRefresh(): Promise<TokenResponse | null> {
        const currentToken = await Storage.getToken();
        if (!currentToken || !currentToken.refresh_token) {
            throw new Error(
                'No refresh token available to perform token refresh.'
            );
        }

        try {
            const response = await this.useRefreshToken(
                currentToken.refresh_token
            );
            await Storage.setToken(response as unknown as string);
            return response;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            return null;
        }
    }

    /**
     * This function fetches a token from a server using a POST request with form data and stores it in
     * local storage.
     * @param {FormData} formData - FormData object containing the data to be sent in the request body.
     * This can include files, text, or a combination of both.
     * @returns A Promise that resolves to a TokenResponse object.
     */
    fetchToken(formData: FormData): Promise<TokenResponse> {
        return new Promise(async (resolve, reject) => {
            const response = await fetch(this.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Kinde-SDK': `ReactNative/${version}`
                },
                body: formData
            });

            const dataResponse = await response.json();
            if (dataResponse.error) {
                reject(dataResponse);
                return;
            }

            await Storage.setToken(dataResponse);
            resolve(dataResponse);
        });
    }

    /**
     * It clears the session storage and sets the authentication status to unauthenticated
     * @returns The Storage.clear() method is being returned.
     */
    async cleanUp() {
        return Storage.clearAll();
    }

    /**
     * It returns the user profile from session storage
     * @returns The user profile object.
     */
    async getUserDetails() {
        return Storage.getUserProfile();
    }

    /**
     * It returns the claims of the token stored in Storage
     * @param {TokenType} [tokenType=accessToken] - The type of token to get the claims from.
     * @returns The claims of the token.
     */
    async getClaims(
        tokenType: TokenType = TokenType.ACCESS_TOKEN
    ): Promise<Record<string, any>> {
        if (![TokenType.ACCESS_TOKEN, TokenType.ID_TOKEN].includes(tokenType)) {
            throw new UnexpectedException('tokenType');
        }

        const token = await Storage.getTokenType(tokenType);
        if (!token) {
            throw new UnAuthenticatedException();
        }

        return jwt_decode(token);
    }

    /**
     * It returns the value of the claim with the given key name from the claims object of the given
     * token type
     * @param {string} keyName - The name of the claim you want to get.
     * @param {TokenType} [tokenType=accessToken] - This is the type of token you want to get the
     * claims from. It can be either 'accessToken' or 'idToken'.
     * @returns The value of the claim with the given key name.
     */
    async getClaim(
        keyName: string,
        tokenType: TokenType = TokenType.ACCESS_TOKEN
    ) {
        const claims = await this.getClaims(tokenType);

        if (!claims.hasOwnProperty(keyName)) {
            console.warn(
                `The claimed value of "${keyName}" does not exist in your token`
            );
        }

        return {
            name: keyName,
            value: claims[keyName] ?? null
        };
    }

    /**
     * It returns an object with the orgCode and permissions properties
     * @returns The orgCode and permissions of the user.
     */
    async getPermissions() {
        const claims = await this.getClaims();
        return {
            orgCode: claims['org_code'],
            permissions: claims['permissions']
        };
    }

    /**
     * It returns an object with the orgCode and a boolean value indicating whether the user has the
     * permission
     * @param {string} permission - The permission you want to check for.
     * @returns An object with two properties: orgCode and isGranted.
     */
    async getPermission(permission: string) {
        const allClaims = await this.getClaims();
        const permissions = allClaims['permissions'];
        return {
            orgCode: allClaims['org_code'],
            isGranted: permissions?.includes(permission)
        };
    }

    /**
     * It returns an object with a single property, `orgCode`, which is set to the value of the
     * `org_code` claim in the JWT
     * @returns An object with the orgCode property set to the value of the org_code claim.
     */
    async getOrganization() {
        const orgCode = (await this.getClaim('org_code')).value;
        return {
            orgCode
        };
    }

    /**
     * It returns an object with a property called orgCodes that contains the value of the org_codes
     * claim from the id_token
     * @returns The orgCodes claim from the id_token.
     */
    async getUserOrganizations() {
        const orgCodes = (await this.getClaim('org_codes', TokenType.ID_TOKEN))
            .value;
        return {
            orgCodes
        };
    }

    /**
     * This is an asynchronous function that retrieves an integer flag value by name, with an optional
     * default value.
     * @param {string} flagName - The name of the flag that you want to retrieve the value for.
     * @param {number} [defaultValue] - The defaultValue parameter is an optional parameter that
     * specifies the default value to be returned if the flag is not set or cannot be retrieved. If
     * this parameter is not provided, the function will return undefined.
     * @returns The `getIntegerFlag` function returns a Promise that resolves to the value of the
     * specified flag as a number. If the flag is not found, it returns the `defaultValue` parameter
     * (if provided) as a number.
     */
    async getIntegerFlag(flagName: string, defaultValue?: number) {
        return (await this.getFlag(flagName, { defaultValue }, 'i')).value;
    }

    /**
     * This is an asynchronous function that retrieves a boolean flag value by name, with an optional
     * default value.
     * @param {string} flagName - A string representing the name of the flag to retrieve.
     * @param {boolean} [defaultValue] - The defaultValue parameter is an optional parameter that
     * specifies the default value to be returned if the flag value is not found in the storage. If
     * this parameter is not provided and the flag value is not found, an error will be thrown.
     * @returns A boolean value is being returned. The value is obtained by calling the `getFlag`
     * method with the specified `flagName` and `defaultValue` (if provided) and passing the `'b'`
     * argument to indicate that the flag value should be interpreted as a boolean. The `await` keyword
     * is used to wait for the `getFlag` method to complete before accessing the `value` property
     */
    async getBooleanFlag(flagName: string, defaultValue?: boolean) {
        return (await this.getFlag(flagName, { defaultValue }, 'b')).value;
    }

    /**
     * This is an asynchronous function that retrieves a string flag value with an optional default
     * value.
     * @param {string} flagName - A string representing the name of the flag that needs to be
     * retrieved.
     * @param {string} [defaultValue] - The `defaultValue` parameter is an optional parameter that
     * specifies the default value to be returned if the flag is not set or cannot be retrieved. If
     * this parameter is not provided and the flag is not set or cannot be retrieved, an error will be
     * thrown.
     * @returns The `getStringFlag` function is returning a string value. It is using the `getFlag`
     * function to retrieve a flag value, and then returning the `value` property of the retrieved
     * flag. If no flag value is found, it will return the `defaultValue` parameter passed to the
     * function.
     */
    async getStringFlag(flagName: string, defaultValue?: string) {
        return (await this.getFlag(flagName, { defaultValue }, 's')).value;
    }

    /**
     * This function retrieves a feature flag and its value, with the option to provide a default value
     * and check its type.
     * @param {string} flagName - A string representing the name of the feature flag being requested.
     * @param {OptionalFlag} options - OptionalFlag is an interface that defines optional parameters
     * for the getFlag function. It may contain a defaultValue property, which is used as the default
     * value for the flag if it is not found in the feature flags. If no defaultValue is provided and
     * the flag is not found, an error will be thrown.
     * @param [flagType] - The type of the feature flag being requested. It is an optional parameter
     * and is used to validate if the requested flag type matches the actual flag type.
     * @returns an object with the following properties:
     * - code: a string representing the flag name
     * - type: a string representing the type of the flag
     * - value: the value of the flag
     * - is_default: a boolean indicating whether the default value was used for the flag
     */
    async getFlag(
        flagName: string,
        options: OptionalFlag = {},
        flagType?: FeatureFlag['t']
    ) {
        let isUsedDefault = false;
        let flag = await this.getFeatureFlags<FeatureFlag>(flagName);
        if (!flag) {
            isUsedDefault = true;
            flag = {
                v: options['defaultValue'],
                t: flagType
            };
        }

        if (!flag['v']) {
            throw new Error(
                `This flag '${flagName}' was not found, and no default value has been provided`
            );
        }

        const flagTypeParsed = FLAG_TYPE[flag['t']!];

        const requestType = FLAG_TYPE[flagType!];
        if (requestType !== undefined && flagTypeParsed !== requestType) {
            throw new Error(
                `Flag '${flagName}' is type ${flagTypeParsed} - requested type ${requestType}`
            );
        }

        return {
            code: flagName,
            type: flagTypeParsed,
            value: flag['v'],
            is_default: isUsedDefault
        };
    }

    /**
     * This is an asynchronous function that retrieves feature flags and returns either all flags or a
     * specific flag based on the input name.
     * @param {string} [name] - `name` is an optional parameter of type `string`. It is used to specify
     * the name of a specific feature flag to retrieve from the `flags` object. If `name` is not
     * provided, the entire `flags` object is returned.
     * @returns The function `getFeatureFlags` returns a Promise that resolves to a value of type `T`.
     * The value returned depends on the input parameter `name` and the value of the `flags` variable.
     * If `name` is provided and `flags` is not null or undefined, the function returns the value of
     * the property with the given name in the `flags` object. Otherwise, the function
     */
    async getFeatureFlags<T>(name?: string): Promise<T> {
        const flags = (await this.getClaim('feature_flags')).value;

        if (name && flags) {
            return flags[name];
        }

        return flags;
    }

    /**
     * This is a TypeScript function that checks if a user is authenticated by checking if their token
     * has expired or if a refresh token can be used to obtain a new token.
     * @returns A promise is being returned, which resolves to a boolean value indicating whether the
     * user is authenticated or not. The function uses asynchronous operations to check if the user's
     * authentication token is still valid, and if not, it tries to use a refresh token to obtain a new
     * token.
     */
    get isAuthenticated() {
        return (async () => {
            const timeExpired = await Storage.getExpiredAt();
            const now = new Date().getTime();

            const isAuthenticated = timeExpired * 1000 > now;
            if (isAuthenticated) {
                return true;
            }

            const token = await Storage.getToken();
            const refreshToken = token?.refresh_token;

            if (!refreshToken) {
                return false;
            }

            try {
                const token = await this.useRefreshToken(refreshToken);
                return (token?.expires_in || 0) > 0;
            } catch (_) {
                return false;
            }
        })();
    }

    get authorizationEndpoint(): string {
        return `${this.issuer}/oauth2/auth`;
    }

    get tokenEndpoint(): string {
        return `${this.issuer}/oauth2/token`;
    }

    get logoutEndpoint(): string {
        return `${this.issuer}/logout`;
    }
}

export default KindeSDK;
