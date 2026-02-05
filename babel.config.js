module.exports = {
    presets: [
        [
            'module:metro-react-native-babel-preset',
            {
                unstable_transformProfile: 'hermes-stable',
                // Prevents deprecated jsx-self/jsx-source plugins conflicting with automatic runtime
                withDevTools: false
            }
        ]
    ]
};
