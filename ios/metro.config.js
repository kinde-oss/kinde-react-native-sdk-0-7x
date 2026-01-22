const path = require('path');
const { getDefaultConfig, mergeConfig } = require('metro-config');

const projectRoot = path.resolve(__dirname, '..');

/**
 * Metro config used only for the iOS sample app.
 *
 * We disable Babel RC lookup so Metro's own prelude isn't transformed into code
 * that calls CommonJS `require(...)` before Metro defines it.
 */
module.exports = (async () => {
    const defaultConfig = await getDefaultConfig(projectRoot);
    const assetRegistryPath = require.resolve(
        'react-native/Libraries/Image/AssetRegistry'
    );
    // Use our custom transformer that forces minimal Babel config
    const babelTransformerPath = path.resolve(
        __dirname,
        'metro-transformer.js'
    );

    return mergeConfig(defaultConfig, {
        transformer: {
            ...defaultConfig.transformer,
            assetRegistryPath,
            babelTransformerPath,
            enableBabelRCLookup: false
        }
    });
})();
