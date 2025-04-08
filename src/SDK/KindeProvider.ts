import React, { useState, useEffect } from 'react';
import { Storage, TokenResponse } from '..';
import { version } from '../../package.json';

export const KindeProvider = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const fetchToken = async (formData: FormData): Promise<TokenResponse> => {
        return new Promise(async (resolve, reject) => {
            const response = await fetch(`your_kinde_issuer/oauth2/token`, {
                // replace `your_kinde_issuer` with kinde domain
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
    };

    const useRefreshToken = async (refreshToken: string) => {
        const formData = new FormData();
        formData.append('client_id', 'your_client_id'); // replace `your_client_id` with kinde client id
        formData.append('grant_type', 'refresh_token');
        formData.append('refresh_token', refreshToken);
        return fetchToken(formData);
    };

    const forceTokenRefresh = async (): Promise<TokenResponse | null> => {
        const currentToken = await Storage.getToken();
        if (!currentToken || !currentToken.refresh_token) {
            throw new Error(
                'No refresh token available to perform token refresh.'
            );
        }

        try {
            const response = await useRefreshToken(currentToken.refresh_token);
            await Storage.setToken(response as unknown as string);
            return response;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            return null;
        }
    };

    const checkToken = async () => {
        try {
            const storedToken = await Storage.getToken();
            const expiry = await Storage.getExpiredAt();
            const currentTime = new Date().getTime();
            if (storedToken && expiry > currentTime) {
                setIsLoggedIn(true);
                const refreshTime = (expiry - 10) * 1000;
                setTimeout(
                    () => forceTokenRefresh(),
                    refreshTime - new Date().getTime()
                );
            } else {
                // Token expired, try refreshing
                await forceTokenRefresh();
            }
        } catch (error) {
            console.error('Error checking token:', error);
        }
    };
    return { checkToken };
};
