import { useMemo, useState } from 'react';
import { extractAccessTokenExpiry, KindeSDK, Storage } from '..';
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

    const scheduleRefresh = async () => {
        const tokenExpiry = await Storage.getExpiredAt();
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingTime = tokenExpiry - currentTime;

        if (remainingTime > 10) {
            setRefreshTimer(remainingTime, () => {
                void authSdk.forceTokenRefresh();
            });
        }
    };

    const verifyToken = async () => {
        try {
            const accessToken = await Storage.getAccessToken();
            const tokenExpiry = extractAccessTokenExpiry(accessToken);
            const currentTime = Math.floor(Date.now() / 1000);
            const remainingTime = tokenExpiry - currentTime;

            if (accessToken && remainingTime > 10) {
                setIsAuthenticated(true);
                await scheduleRefresh();
            } else {
                const refreshSuccess = await authSdk.forceTokenRefresh();

                if (!refreshSuccess) {
                    await handleLogout();
                    return;
                }

                const persistedAccessToken = await Storage.getAccessToken();
                if (!persistedAccessToken) {
                    await handleLogout();
                    return;
                }

                setIsAuthenticated(true);
                const refreshRemainingTime = Number(
                    refreshSuccess.expires_in || 0
                );

                if (refreshRemainingTime > 10) {
                    setRefreshTimer(refreshRemainingTime, () => {
                        void authSdk.forceTokenRefresh();
                    });
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
        verifyToken,
        authSdk
    };
};
