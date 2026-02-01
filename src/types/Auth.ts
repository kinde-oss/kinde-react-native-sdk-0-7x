export type IOSCustomBrowser = 'safari' | 'chrome' | 'opera' | 'firefox';

export type AndroidCustomBrowser =
    | 'chrome'
    | 'firefox'
    | 'chromeCustomTab'
    | 'firefoxCustomTab'
    | 'samsung'
    | 'samsungCustomTab';

/**
 * Browser/session options accepted by this SDK.
 *
 * This used to be an alias of `react-native-inappbrowser-reborn`'s options.
 * We keep a compatible surface so consuming apps don't break when upgrading.
 *
 * Only a subset is used by the SDK; unknown keys are ignored.
 */
export type AuthBrowserOptions = {
    /**
     * Historical name from `react-native-inappbrowser-reborn`.
     * Mapped to `react-native-app-auth` iOS option `iosPrefersEphemeralSession`.
     */
    ephemeralWebSession?: boolean;

    /**
     * `react-native-app-auth` iOS option.
     * Prefer this if you want to be explicit.
     */
    iosPrefersEphemeralSession?: boolean;

    /**
     * `react-native-app-auth` iOS option.
     * Examples include: 'safari', 'chrome', 'firefox' (library-dependent).
     */
    iosCustomBrowser?: IOSCustomBrowser;

    /** `react-native-app-auth` Android option. */
    androidAllowCustomBrowsers?: AndroidCustomBrowser[];

    /** Legacy options that are now ignored but kept for compatibility. */
    showTitle?: boolean;
    enableUrlBarHiding?: boolean;
    enableDefaultShare?: boolean;
    forceCloseOnRedirection?: boolean;
    showInRecents?: boolean;
};
