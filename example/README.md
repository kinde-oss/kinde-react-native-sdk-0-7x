# Example App (KindeSDKRN)

The iOS and Android samples use React Native 0.87.1, React 19.2.3 and the New
Architecture. These development requirements do not raise the published SDK's
React Native peer requirement of >= 0.73.

## Breaking changes and compatibility

This is a breaking upgrade for contributors running the native samples:

- React Native 0.73 / React 18 development tooling moves to React Native
  0.87.1 / React 19.2.3.
- The samples require the New Architecture, iOS 15.1+ and Android API 24+.
  Their Node, Xcode, Gradle and Android SDK requirements also change below.
- Obsolete manually linked React Native Xcode projects and tvOS targets are
  removed. Only the iOS app and its existing test target are migrated here.

These are **not intended SDK consumer breaking changes**: the published runtime
dependencies, peer ranges and public method signatures remain unchanged. The six
new CLI/Babel/Jest/Metro packages are development-only. Consumers do not have to
upgrade their applications to React 19 or React Native 0.87 to use this SDK.
The only SDK source adjustment normalizes an absent initial URL with `url ?? null`,
retaining support for the older `string | null` result.

Keeping the SDK compatible is different from proving compatibility. CI includes
a separate React Native 0.73 / React 18 build and test project; that job and native
authentication/device checks must pass before compatibility is considered verified.

The newer sample platform floors and New Architecture requirement cannot be
retained at their old values while using supported React Native 0.87.1 settings.
If older development environments must remain supported, use a separate legacy
sample/tooling lane or defer this tooling upgrade; do not lower native requirements
or disable the New Architecture to force a build.

## Prerequisites

| Tool                    | Required version                                        |
| ----------------------- | ------------------------------------------------------- |
| Node.js                 | 22.13+ on Node 22, 24.3+ on Node 24, or 26+             |
| Ruby                    | 3.4.10, pinned in `ios/.ruby-version` and `ios/Gemfile` |
| CocoaPods               | Install through the pinned Bundler environment          |
| Xcode                   | 16.1+ with an iOS 15.1+ simulator                       |
| JDK                     | 17+ compatible with Gradle 9.4.1                        |
| Android SDK             | Platform 37, Build Tools 37.0.0 and NDK 27.1.12297006   |
| Android device/emulator | API 24+                                                 |

Use the repository's declared Yarn version to install JavaScript dependencies:

```bash
# From the repository root
yarn install
```

## Configure Kinde

Update `kindeConfig` in [App.tsx](./App.tsx) with your Kinde domain and public
application client ID. Register these URLs in the Kinde dashboard:

- Callback: `com.kindesdkrn://kinde_callback`
- Logout redirect: `com.kindesdkrn://kinde_logout`

Do not put a client secret in the mobile app. On iOS the app delegate forwards
OAuth callbacks to AppAuth before handling other links through React Native.
On Android AppAuth receives the login callback and the main activity handles the
distinct logout URL through React Native Linking.

## iOS

With the pinned Ruby selected:

```bash
cd example/ios
bundle install
bundle exec pod install
cd ../..
npm start
```

In another terminal, run `npm run ios`, or open
`example/ios/KindeSDKRN.xcworkspace` in Xcode and run the `KindeSDKRN` scheme.
Always open the workspace, not the project, so CocoaPods dependencies are linked.

The sample targets iOS 15.1+ and uses the React Native factory and dependency
provider. Autolinking supplies AppAuth, Keychain and random values; no legacy
Flipper, Boost download override or manual React Native library linking is used.

## Android

Set `ANDROID_HOME` to your Android SDK directory and make the JDK available via
`JAVA_HOME`. Start Metro with `npm start`, then run `npm run android` from another
terminal with an emulator or device connected.

To compile without launching a device:

```bash
cd android
./gradlew :app:assembleDebug
```

The sample targets Android API 36, compiles against API 37 and requires API 24+.
Both platforms use `example/index.js` as their JavaScript entry point.

## Validation

From the repository root:

```bash
npm run build
npm test -- --runInBand
npm run lint
```

Native builds and a real authentication smoke test are also required before
claiming the migration is regression-free. Exercise login, registration, secure
token persistence, token refresh, invitation links and logout on both platforms.
Unit tests mock authentication and storage and do not replace those device checks.

If CocoaPods or Gradle fails, fix the reported prerequisite or dependency issue;
do not disable the New Architecture or patch installed dependencies to hide it.

## Migration references

- [Official React Native 0.87.1 template](https://github.com/react-native-community/template/tree/0.87.1/template):
  the development dependency versions, Babel/Metro presets, Android toolchain
  and native application entry points follow this versioned reference.
- [Android Gradle properties](https://github.com/react-native-community/template/blob/0.87.1/template/android/gradle.properties):
  the `android.builtInKotlin=false` and `android.newDsl=false` settings are
  upstream AGP 9 compatibility settings, not local dependency patches.
- [iOS factory startup](https://github.com/react-native-community/template/blob/0.87.1/template/ios/HelloWorld/AppDelegate.swift)
  and [Podfile](https://github.com/react-native-community/template/blob/0.87.1/template/ios/Podfile):
  this sample retains Objective-C++ to preserve its existing AppAuth callbacks,
  and adjusts the application root to the repository's nested iOS layout.
- [React Native 0.82: New Architecture only](https://reactnative.dev/blog/2025/10/08/react-native-0.82):
  disabling the New Architecture is not a supported migration path.
