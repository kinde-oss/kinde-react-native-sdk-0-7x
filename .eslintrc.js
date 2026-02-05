module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    globals: {
        window: true,
        module: true
    },
    extends: ['eslint:recommended', 'prettier'],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    rules: {
        'no-prototype-builtins': 'off',
        'no-useless-escape': 'off',
        'no-undef': 'off',
        'no-empty': 'off',
        'no-redeclare': 'off',
        'no-async-promise-executor': 'off',
        'no-unused-vars': 'off',
        'no-var': 'off'
    },
    overrides: [
        {
            files: ['src/**/*.ts', 'src/**/*.tsx', '__tests__/**/*.ts'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: 'module'
            },
            plugins: ['@typescript-eslint'],
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended',
                'prettier'
            ],
            rules: {
                '@typescript-eslint/no-unused-vars': 'off',
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/ban-ts-comment': 'off',
                '@typescript-eslint/prefer-as-const': 'off',
                'no-empty': 'off',
                'no-async-promise-executor': 'off',
                'no-prototype-builtins': 'off',
                'no-var': 'off'
            }
        }
    ]
};
