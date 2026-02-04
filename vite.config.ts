import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'KindeReactNativeSDK',
            formats: ['cjs', 'es'],
            fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`
        },
        rollupOptions: {
            external: [
                'react',
                'react-native',
                'react-native-app-auth',
                'react-native-keychain',
                'react-native-get-random-values',
                '@kinde/js-utils',
                'crypto-js',
                'jwt-decode',
                'url-parse'
            ],
            output: {
                globals: {
                    react: 'React',
                    'react-native': 'ReactNative'
                }
            }
        },
        outDir: 'dist',
        sourcemap: true,
        emptyOutDir: true
    },
    plugins: [
        dts({
            include: ['src'],
            outDir: 'dist',
            rollupTypes: true
        })
    ]
});
