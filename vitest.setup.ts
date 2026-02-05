import { vi } from 'vitest';

// Define __DEV__ global for React Native compatibility
(global as any).__DEV__ = true;

// Setup global mocks that were previously in the test file
const crypto = require('crypto');

Object.defineProperty(globalThis, 'crypto', {
    value: {
        getRandomValues: (arr: any) => crypto.randomBytes(arr.length),
        subtle: {
            digest: (algorithm: string, data: any) => {
                return new Promise((resolve) => {
                    const hash = crypto.createHash(
                        algorithm.replace('-', '').toLowerCase()
                    );
                    hash.update(Buffer.from(data));
                    resolve(hash.digest());
                });
            }
        }
    }
});

function FormDataMock() {
    (this as any)[Symbol.for('state')] = [] as Array<{
        name: string;
        value: string;
    }>;
}

FormDataMock.prototype.append = function (key: string, value: string) {
    (this as any)[Symbol.for('state')].push({ key, value });
};

(global as any).FormData = FormDataMock;

// Mock react-native-keychain
vi.mock('react-native-keychain', () => ({
    setGenericPassword: vi.fn().mockResolvedValue(undefined),
    getGenericPassword: vi.fn().mockResolvedValue(undefined),
    resetGenericPassword: vi.fn().mockResolvedValue(undefined)
}));

// Mock react-native-app-auth
vi.mock('react-native-app-auth', () => ({
    authorize: vi.fn().mockResolvedValue({}),
    logout: vi.fn().mockResolvedValue({})
}));

// Mock react-native
vi.mock('react-native', () => ({
    Linking: {
        canOpenURL: vi.fn().mockResolvedValue(true),
        openURL: vi.fn().mockResolvedValue(true),
        addEventListener: vi.fn((eventName: string, handler: any) => {
            // Default behavior: immediately simulate a redirect back into the app.
            if (
                eventName === 'url' &&
                handler &&
                typeof handler === 'function'
            ) {
                setTimeout(() => {
                    try {
                        handler({
                            url: 'myapp://myhost.kinde.com/kinde_callback'
                        });
                    } catch (_) {
                        // ignore
                    }
                }, 0);
            }
            return { remove: vi.fn() };
        }),
        removeEventListener: vi.fn()
    }
}));

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
    default: vi.fn().mockReturnValue({})
}));

// Mock ApiClient
vi.mock('../src/ApiClient', () => ({}));
