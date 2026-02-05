import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/__tests__/**/*.{test,spec}.{js,ts,tsx}'],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.{idea,git,cache,output,temp}/**'
        ],
        setupFiles: ['./vitest.setup.ts'],
        server: {
            deps: {
                inline: [
                    'react-native',
                    '@react-native',
                    'react-native-keychain',
                    'react-native-app-auth'
                ]
            }
        }
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
            'react-native': path.resolve(__dirname, 'node_modules/react-native')
        }
    },
    esbuild: {
        target: 'es2020'
    }
});
