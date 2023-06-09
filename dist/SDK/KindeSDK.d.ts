/**
 * Kinde Management API
 * Provides endpoints to manage your Kinde Businesses
 *
 * The version of the OpenAPI document: 1.1.2
 * Contact: support@kinde.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 *
 */
import { AdditionalParameters, OrgAdditionalParams, TokenResponse } from '../types/KindeSDK';
import { TokenType } from './Enums';
/**
 * The KindeSDK module.
 * @module SDK/KindeSDK
 * @version 1.1.2
 */
declare class KindeSDK {
    issuer: string;
    redirectUri: string;
    clientId: string;
    logoutRedirectUri: string;
    scope: string;
    clientSecret?: string;
    additionalParameters: AdditionalParameters;
    /**
     * The constructor function takes in a bunch of parameters and sets them to the class properties
     * @param {string} issuer - The URL of the OIDC provider.
     * @param {string} redirectUri - The URI that the OIDC provider will redirect to after the user has
     * logged in.
     * @param {string} clientId - The client ID of your application.
     * @param {string} logoutRedirectUri - The URL to redirect to after logout.
     * @param {string} [scope=openid profile email offline] - The scope of the authentication. This is
     * a space-separated list of scopes.
     * @param {AdditionalParameters} additionalParameters - AdditionalParameters = {}
     */
    constructor(issuer: string, redirectUri: string, clientId: string, logoutRedirectUri: string, scope?: string, additionalParameters?: Pick<AdditionalParameters, 'audience'>);
    /**
     * The function takes an object as an argument, and if the object is empty, it will use the default
     * object
     * @param {AdditionalParameters} additionalParameters - AdditionalParameters = {}
     * @returns A promise that resolves to void.
     */
    login(additionalParameters?: Omit<OrgAdditionalParams, 'is_create_org'>): Promise<TokenResponse | null>;
    /**
     * This function registers an organization with additional parameters and authenticates it using an
     * authorization code.
     * @param {OrgAdditionalParams} additionalParameters - `additionalParameters` is an optional object
     * parameter that can be passed to the `register` function. It is used to provide additional
     * parameters that may be required for the registration process. These parameters can vary
     * depending on the specific implementation of the registration process.
     * @returns A Promise that resolves to void.
     */
    register(additionalParameters?: OrgAdditionalParams): Promise<TokenResponse | null>;
    /**
     * This function creates an organization with additional parameters.
     * @param additionalParameters
     * @returns A promise that resolves to void.
     */
    createOrg(additionalParameters?: Omit<OrgAdditionalParams, 'is_create_org'>): Promise<TokenResponse | null>;
    /**
     * It cleans up the local storage, and then opens a URL that will log the user out of the identity
     * provider
     */
    logout(): Promise<boolean>;
    /**
     * This function retrieves a token from a given URL using authorization code grant type and checks
     * for validity before doing so.
     * @param {string} [url] - The URL to fetch the token from. It is an optional parameter with a
     * default value of an empty string.
     * @returns The function `getToken` is returning a Promise that resolves to a `TokenResponse`
     * object.
     */
    getToken(url?: string): Promise<TokenResponse>;
    /**
     * This function refreshes an access token using a refresh token.
     * @param {TokenResponse} [token] - The `token` parameter is an optional parameter of type
     * `TokenResponse`. It represents the token that needs to be refreshed. If this parameter is not
     * provided, the function will try to retrieve the token from the storage using the
     * `Storage.getToken()` method.
     * @returns The `useRefreshToken` function is returning the result of calling the `fetchToken`
     * function with a `FormData` object containing the necessary parameters for refreshing an access
     * token.
     */
    useRefreshToken(token?: TokenResponse | null): Promise<TokenResponse>;
    /**
     * This function fetches a token from a server using a POST request with form data and stores it in
     * local storage.
     * @param {FormData} formData - FormData object containing the data to be sent in the request body.
     * This can include files, text, or a combination of both.
     * @returns A Promise that resolves to a TokenResponse object.
     */
    fetchToken(formData: FormData): Promise<TokenResponse>;
    /**
     * It clears the session storage and sets the authentication status to unauthenticated
     * @returns The Storage.clear() method is being returned.
     */
    cleanUp(): Promise<boolean>;
    /**
     * It returns the user profile from session storage
     * @returns The user profile object.
     */
    getUserDetails(): Promise<import("../types/KindeSDK").UserProfile>;
    /**
     * It returns the claims of the token stored in Storage
     * @param {TokenType} [tokenType=accessToken] - The type of token to get the claims from.
     * @returns The claims of the token.
     */
    getClaims(tokenType?: TokenType): Promise<Record<string, any>>;
    /**
     * It returns the value of the claim with the given key name from the claims object of the given
     * token type
     * @param {string} keyName - The name of the claim you want to get.
     * @param {TokenType} [tokenType=accessToken] - This is the type of token you want to get the
     * claims from. It can be either 'accessToken' or 'idToken'.
     * @returns The value of the claim with the given key name.
     */
    getClaim(keyName: string, tokenType?: TokenType): Promise<any>;
    /**
     * It returns an object with the orgCode and permissions properties
     * @returns The orgCode and permissions of the user.
     */
    getPermissions(): Promise<{
        orgCode: any;
        permissions: any;
    }>;
    /**
     * It returns an object with the orgCode and a boolean value indicating whether the user has the
     * permission
     * @param {string} permission - The permission you want to check for.
     * @returns An object with two properties: orgCode and isGranted.
     */
    getPermission(permission: string): Promise<{
        orgCode: any;
        isGranted: any;
    }>;
    /**
     * It returns an object with a single property, `orgCode`, which is set to the value of the
     * `org_code` claim in the JWT
     * @returns An object with the orgCode property set to the value of the org_code claim.
     */
    getOrganization(): Promise<{
        orgCode: any;
    }>;
    /**
     * It returns an object with a property called orgCodes that contains the value of the org_codes
     * claim from the id_token
     * @returns The orgCodes claim from the id_token.
     */
    getUserOrganizations(): Promise<{
        orgCodes: any;
    }>;
    /**
     * This is a TypeScript function that checks if a user is authenticated by checking if their token
     * has expired or if a refresh token can be used to obtain a new token.
     * @returns A promise is being returned, which resolves to a boolean value indicating whether the
     * user is authenticated or not. The function uses asynchronous operations to check if the user's
     * authentication token is still valid, and if not, it tries to use a refresh token to obtain a new
     * token.
     */
    get isAuthenticated(): Promise<boolean>;
    get authorizationEndpoint(): string;
    get tokenEndpoint(): string;
    get logoutEndpoint(): string;
}
export default KindeSDK;
