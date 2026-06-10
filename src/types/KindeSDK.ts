export type AdditionalParameters = {
    audience?: string | string[];
    /** @deprecated use isCreateOrg field instead */
    is_create_org?: boolean;
    /** @deprecated use orgCode field instead */
    org_code?: string;
    /** @deprecated use orgName field instead */
    org_name?: string;
    /** @deprecated use connectionId field instead */
    connection_id?: string;
    lang?: string;
    /** @deprecated use loginHint field instead */
    login_hint?: string;
    plan_interest?: string;
    pricing_table_key?: string;
};

export type OrgAdditionalParams = Omit<AdditionalParameters, 'audience'>;

export type UserProfile = {
    id: string;
    given_name: string;
    family_name: string;
    email: string;
    picture: string;
};

export type TokenResponse = {
    access_token: string;
    refresh_token: string;
    id_token: string;
    scope: string;
    token_type: string;
    expires_in: number;
};

export type AccessTokenDecoded = {
    aud: string[];
    azp: string;
    exp: number;
    iat: number;
    iss: string;
    jti: string;
    gty?: string[];
    scp?: string[];
} & Record<string, any>;

export type IdTokenDecoded = {
    sub: string;
    given_name: string;
    family_name: string;
    email: string;
    picture: string;
} & Record<string, any>;

export type OptionalFlag = {
    defaultValue?: string | boolean | number;
};

export type FeatureFlagType = 's' | 'b' | 'i';

export type FeatureFlagValue = string | boolean | number;

export type FeatureFlag = {
    v?: FeatureFlagValue; // v -> value
    t?: FeatureFlagType; // t -> type, s -> string, b -> boolean, i -> integer
};

export type LoginAdditionalParameters = Omit<
    OrgAdditionalParams,
    'is_create_org'
> & {
    [key: string]: unknown;
};

export type RegisterAdditionalParameters = OrgAdditionalParams & {
    [key: string]: unknown;
};
