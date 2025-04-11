import { useMemo, useState } from 'react';
import { KindeSDK, Storage } from '..';
import { setRefreshTimer } from '@kinde/js-utils';

export interface KindeProviderProps {
    issuerUrl: string;
    clientId: string;
    redirectUri: string;
    logoutRedirectUri: string;
}

export const useKindeProvider = ({
    issuerUrl,
    clientId,
    redirectUri,
    logoutRedirectUri
}: KindeProviderProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const authSdk = useMemo(
        () => new KindeSDK(issuerUrl, redirectUri, clientId, logoutRedirectUri),
        [issuerUrl, clientId, redirectUri, logoutRedirectUri]
    );

    const verifyToken = async () => {
        try {
            const savedToken = await Storage.getToken();
            const tokenExpiry = await Storage.getExpiredAt();
            const currentTime = Math.floor(Date.now() / 1000);
            const remainingTime = tokenExpiry - currentTime;

            if (savedToken && remainingTime > 10) {
                setIsAuthenticated(true);
                setRefreshTimer(tokenExpiry, authSdk.forceTokenRefresh);
            } else {
                const refreshSuccess = await authSdk.forceTokenRefresh();
                if (!refreshSuccess) {
                    await handleLogout();
                } else {
                    setIsAuthenticated(true);
                }
            }
        } catch (error) {
            console.error('Error verifying token:', error);
            await handleLogout();
            setIsAuthenticated(false);
        }
    };

    const handleLogout = async () => {
        try {
            await Storage.clearAll();
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    return {
        isAuthenticated,
        verifyToken
    };
};
