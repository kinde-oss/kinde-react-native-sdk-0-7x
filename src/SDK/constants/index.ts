import { FeatureFlagType } from '../../types/KindeSDK';

export const AdditionalParametersAllow = {
    audience: 'string',
    is_create_org: 'boolean',
    org_code: 'string',
    org_name: 'string'
};

export const FLAG_TYPE: Record<FeatureFlagType, string> = {
    s: 'string',
    i: 'number', // integer
    b: 'boolean'
};
