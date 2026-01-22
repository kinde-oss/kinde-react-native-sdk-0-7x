import { useMemo, useState } from 'react';
import { SafeAreaView, Button, Text, View, ScrollView } from 'react-native';
import KindeSDK from '../src/SDK/KindeSDK';

// ⚠️ IMPORTANT: Update these values before running the iOS sample!
// 1. Set your Kinde domain (e.g., https://yourapp.kinde.com)
// 2. Set your Kinde client ID from the Kinde dashboard
// 3. The redirect URI scheme (before ://) must match CFBundleURLSchemes in ios/KindeSDKRN/Info.plist
// 4. Add both redirect URIs to your Kinde application's "Allowed callback URLs"
const kindeConfig = {
    domain: 'https://YOUR_SUBDOMAIN.kinde.com',
    clientId: 'YOUR_CLIENT_ID',
    redirectUri: 'com.kindesdkrn://kinde_callback',
    logoutRedirectUri: 'com.kindesdkrn://kinde_logout',
    scope: 'openid profile email offline'
};

export default function App() {
    const [status, setStatus] = useState<string>('Not authenticated');
    const [error, setError] = useState<string | null>(null);

    const client = useMemo(() => {
        // KindeSDK constructor signature (issuer, redirectUri, clientId, logoutRedirectUri, scope?)
        return new KindeSDK(
            kindeConfig.domain,
            kindeConfig.redirectUri,
            kindeConfig.clientId,
            kindeConfig.logoutRedirectUri,
            kindeConfig.scope
        );
    }, []);

    const onLogin = async () => {
        setError(null);
        setStatus('Logging in…');
        try {
            const token = await client.login();
            if (!token) {
                setStatus('Login cancelled / failed');
                return;
            }
            setStatus(`Logged in. Expires: ${token.expires_in ?? 'n/a'}`);
        } catch (e: any) {
            setStatus('Login error');
            setError(e?.message ?? String(e));
        }
    };

    const onLogout = async () => {
        setError(null);
        setStatus('Logging out…');
        try {
            const ok = await client.logout(false);
            setStatus(ok ? 'Logged out (redirect received)' : 'Logout failed');
        } catch (e: any) {
            setStatus('Logout error');
            setError(e?.message ?? String(e));
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '600' }}>
                    KindeSDKRN iOS sample
                </Text>
                <Text>Status: {status}</Text>
                {error ? (
                    <View style={{ padding: 12, backgroundColor: '#fee2e2' }}>
                        <Text style={{ color: '#991b1b' }}>{error}</Text>
                    </View>
                ) : null}
                <Button title="Login" onPress={onLogin} />
                <Button title="Logout" onPress={onLogout} />
                <Text style={{ marginTop: 12, opacity: 0.7 }}>
                    Set kindeConfig in ios/App.tsx before testing.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
