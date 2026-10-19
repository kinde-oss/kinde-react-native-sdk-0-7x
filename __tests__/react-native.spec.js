const React = require('react');
const { Linking, Text, View } = require('react-native');
const { act, create } = require('react-test-renderer');

test('renders native components with the installed React and React Native', async () => {
    let renderer;
    await act(async () => {
        renderer = create(
            React.createElement(
                View,
                null,
                React.createElement(Text, null, 'KindeSDKRN')
            )
        );
    });

    expect(renderer.root.findByType(Text).props.children).toBe('KindeSDKRN');
    expect(typeof Linking.getInitialURL).toBe('function');
    expect(typeof Linking.addEventListener).toBe('function');

    await act(async () => {
        renderer.unmount();
    });
});
