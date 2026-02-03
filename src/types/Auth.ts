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
 * This SDK now uses `react-native-app-auth` (replacing `react-native-inappbrowser-reborn`).
 * For backward compatibility, all legacy `InAppBrowserOptions` properties are accepted but
 * most are ignored since they have no equivalent in `react-native-app-auth`.
 *
 * **Active options** (actually used):
 * - `iosPrefersEphemeralSession` / `ephemeralWebSession` (mapped)
 * - `iosCustomBrowser`
 * - `androidAllowCustomBrowsers`
 *
 * **Deprecated options** (accepted but ignored):
 * All other properties from the old `InAppBrowserOptions` type.
 */
export type AuthBrowserOptions = {
    // =====================================================================
    // ACTIVE OPTIONS (used by react-native-app-auth)
    // =====================================================================

    /**
     * iOS: Use an ephemeral (private) browser session that doesn't share cookies
     * with Safari. Recommended for better privacy.
     */
    iosPrefersEphemeralSession?: boolean;

    /**
     * iOS: Specify a custom browser to use for authentication.
     */
    iosCustomBrowser?: IOSCustomBrowser;

    /**
     * Android: List of allowed custom browsers for authentication.
     */
    androidAllowCustomBrowsers?: AndroidCustomBrowser[];

    // =====================================================================
    // DEPRECATED OPTIONS (kept for backward compatibility)
    // These were from react-native-inappbrowser-reborn and are now ignored.
    // =====================================================================

    /**
     * @deprecated Use `iosPrefersEphemeralSession` instead.
     * This is mapped to `iosPrefersEphemeralSession` for backward compatibility.
     */
    ephemeralWebSession?: boolean;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    animated?: boolean;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    animations?: {
        startEnter?: string;
        startExit?: string;
        endEnter?: string;
        endExit?: string;
    };

    /**
     * @deprecated Use `androidAllowCustomBrowsers` instead.
     * No direct mapping available.
     */
    browserPackage?: string;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    dismissButtonStyle?: 'done' | 'close' | 'cancel';

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    enableBarCollapsing?: boolean;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    enableDefaultShare?: boolean;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    enableUrlBarHiding?: boolean;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    forceCloseOnRedirection?: boolean;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    formSheetPreferredContentSize?: {
        height?: number;
        width?: number;
    };

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    hasBackButton?: boolean;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    headers?: Record<string, string>;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    includeReferrer?: boolean;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    modalEnabled?: boolean;

    /**
     * @deprecated No equivalent in react-native-app-auth. Ignored.
     */
    modalPresentationStyle?:
        | 'automatic'
        | 'fullScreen'
        | 'pageSheet'
        | 'formSheet'
        | 'currentContext'
        | 'custom'
        | 'overFullScreen'
        | 'overCurrentContext'
        | 'popover'
        | 'none';

    /**
     * @deprecated No equivalent in react-native-app-auth. Ignored.
     */
    modalTransitionStyle?:
        | 'coverVertical'
        | 'flipHorizontal'
        | 'crossDissolve'
        | 'partialCurl';

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    navigationBarColor?: string;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    navigationBarDividerColor?: string;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    preferredBarTintColor?: string;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    preferredControlTintColor?: string;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    readerMode?: boolean;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    secondaryToolbarColor?: string;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    showInRecents?: boolean;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    showTitle?: boolean;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    toolbarColor?: string;

    /** @deprecated No equivalent in react-native-app-auth. Ignored. */
    waitForRedirectDelay?: number;
};

/**
 * List of deprecated AuthBrowserOptions keys that are no longer functional.
 * Used internally to emit deprecation warnings.
 */
export const DEPRECATED_AUTH_BROWSER_OPTIONS: readonly string[] = [
    'animated',
    'animations',
    'browserPackage',
    'dismissButtonStyle',
    'enableBarCollapsing',
    'enableDefaultShare',
    'enableUrlBarHiding',
    'forceCloseOnRedirection',
    'formSheetPreferredContentSize',
    'hasBackButton',
    'headers',
    'includeReferrer',
    'modalEnabled',
    'modalPresentationStyle',
    'modalTransitionStyle',
    'navigationBarColor',
    'navigationBarDividerColor',
    'preferredBarTintColor',
    'preferredControlTintColor',
    'readerMode',
    'secondaryToolbarColor',
    'showInRecents',
    'showTitle',
    'toolbarColor',
    'waitForRedirectDelay'
] as const;

/**
 * Logs a warning if any deprecated AuthBrowserOptions are being used.
 * Only warns once per session and only in non-production environments.
 */
let hasWarnedDeprecated = false;
export function warnDeprecatedAuthBrowserOptions(
    options?: AuthBrowserOptions
): void {
    if (!options || hasWarnedDeprecated) return;

    // Check for deprecated `ephemeralWebSession` (has a mapping, so separate warning)
    if (
        options.ephemeralWebSession !== undefined &&
        options.iosPrefersEphemeralSession === undefined
    ) {
        console.warn(
            '[KindeSDK] `ephemeralWebSession` is deprecated. Use `iosPrefersEphemeralSession` instead.'
        );
    }

    // Check for fully deprecated options (no equivalent)
    const usedDeprecated = DEPRECATED_AUTH_BROWSER_OPTIONS.filter(
        (key) =>
            Object.prototype.hasOwnProperty.call(options, key) &&
            (options as Record<string, unknown>)[key] !== undefined
    );

    if (usedDeprecated.length > 0) {
        hasWarnedDeprecated = true;
        console.warn(
            `[KindeSDK] The following AuthBrowserOptions are deprecated and will be ignored: ${usedDeprecated.join(
                ', '
            )}. ` +
                'These options were from react-native-inappbrowser-reborn and have no equivalent in react-native-app-auth.'
        );
    }
}

/**
 * Resets the deprecation warning state. Useful for testing.
 * @internal
 */
export function resetDeprecationWarningState(): void {
    hasWarnedDeprecated = false;
}
