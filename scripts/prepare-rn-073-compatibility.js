const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const destination = path.join(root, '.tsupgrader', 'rn-073');
const manifest = require(path.join(root, 'package.json'));
const developmentPackages = [
    '@babel/cli',
    '@babel/core',
    '@types/crypto-js',
    '@types/node',
    '@types/react-native-get-random-values',
    '@types/url-parse',
    'babel-jest',
    'jest',
    'react-native-app-auth',
    'react-native-get-random-values',
    'react-native-keychain',
    'rimraf',
    'typescript'
];

fs.mkdirSync(destination, { recursive: true });

// Copies ensure module resolution uses the fixture's React Native, not the root's.
for (const file of ['src', '__tests__', 'tsconfig.json', 'babel.config.js']) {
    fs.cpSync(path.join(root, file), path.join(destination, file), {
        recursive: true
    });
}

const fixture = {
    name: 'kinde-rn-073-compatibility',
    private: true,
    version: manifest.version,
    packageManager: manifest.packageManager,
    scripts: {
        build: manifest.scripts.build,
        'build:types': manifest.scripts['build:types'],
        'build:js': manifest.scripts['build:js'],
        test: manifest.scripts.test
    },
    dependencies: manifest.dependencies,
    devDependencies: {
        ...Object.fromEntries(
            developmentPackages.map((name) => [
                name,
                manifest.devDependencies[name]
            ])
        ),
        '@react-native/babel-preset': '0.73.0',
        '@types/react': '^18.2.0',
        react: '18.2.0',
        'react-native': '0.73.0',
        'react-test-renderer': '18.2.0'
    },
    overrides: manifest.overrides,
    jest: {
        ...manifest.jest,
        preset: 'react-native',
        watchman: false
    }
};

fs.writeFileSync(
    path.join(destination, 'package.json'),
    `${JSON.stringify(fixture, null, 4)}\n`
);
console.log(
    `Prepared React Native 0.73 compatibility project at ${destination}`
);
