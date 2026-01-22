/**
 * Custom Babel transformer for the iOS sample app.
 *
 * This wraps Metro's default transformer but forces a minimal Babel config
 * that does NOT include @babel/preset-env (which transforms code to use
 * require("@babel/runtime/helpers/...") before Metro's require is defined).
 */
const metroTransformer = require('metro-react-native-babel-transformer');

module.exports.transform = function ({ src, filename, options, ...rest }) {
    // Force minimal Babel options - only metro-react-native-babel-preset
    const babelOptions = {
        ...options,
        // Override any presets/plugins from repo-root babel.config.js
        presets: ['module:metro-react-native-babel-preset'],
        plugins: [],
        // Disable config file lookup entirely
        configFile: false,
        babelrc: false
    };

    return metroTransformer.transform({
        src,
        filename,
        options: babelOptions,
        ...rest
    });
};
