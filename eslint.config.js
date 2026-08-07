const { defineConfig, globalIgnores } = require('eslint/config');

const globals = require('globals');
const babelParser = require('@babel/eslint-parser');
const js = require('@eslint/js');

const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
    js.configs.recommended,
    eslintConfigPrettier,
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                window: true,
                module: true,
                jest: true
            },

            ecmaVersion: 13,
            sourceType: 'module',
            parserOptions: {},
            parser: babelParser
        },

        rules: {
            'no-prototype-builtins': 'off',
            'no-useless-escape': 'off',
            'no-undef': 'off',
            'no-empty': 'off',
            'no-redeclare': 'off',
            'no-async-promise-executor': 'off',
            'no-unused-vars': 'off'
        }
    },
    globalIgnores([
        '**/node_modules',
        '**/dist/',
        '**/.DS_Store',
        '**/coverage',
        '**/.jest',
        '**/*.spec.*',
        '**/ios/',
        '**/android/'
    ])
]);
