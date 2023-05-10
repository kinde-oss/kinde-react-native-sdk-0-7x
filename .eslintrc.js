module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    globals: {
        window: true,
        module: true,
        jest: true
    },
    extends: ['eslint:recommended', 'prettier'],
    parserOptions: {
        ecmaVersion: 13,
        sourceType: 'module'
    },
    parser: '@babel/eslint-parser',
    plugins: [],
    rules: {
        'no-prototype-builtins': 'off',
        'no-useless-escape': 'off',
        'no-undef': 'off',
        'no-empty': 'off',
        'no-redeclare': 'off',
        'no-async-promise-executor': 'off',
        'no-unused-vars': 'off'
    }
};
