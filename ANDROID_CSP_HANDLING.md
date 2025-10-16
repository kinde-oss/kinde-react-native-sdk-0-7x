# Android Custom Domain CSP Handling

## Problem
When using custom domains with Kinde authentication on Android, the login/register pages may render without CSS styling due to Content Security Policy (CSP) headers being enforced more strictly on Android WebView compared to iOS.

## Solution Implemented

The SDK now automatically detects custom domains and applies enhanced browser options to handle CSP issues:

### Automatic Detection
- Detects if the authentication URL uses a custom domain (not `kinde.com`)
- Applies enhanced browser configuration automatically
- Logs helpful debugging information

### Enhanced Browser Options
For custom domains, the SDK applies:
- Optimized WebView settings for Android
- Better handling of mixed content
- Improved resource loading

### Fallback Mechanism
If the in-app browser fails for custom domains:
- Automatically attempts to open the system browser
- Provides clear error messages and debugging info

## Usage

No changes required in your code - the SDK handles this automatically:

```typescript
import { KindeSDK } from '@kinde-oss/react-native-sdk-0-7x';

const client = new KindeSDK(
    'https://your-custom-domain.com', // Custom domain
    'your-redirect-uri',
    'your-client-id',
    'your-logout-redirect-uri'
);

// This will automatically apply CSP handling for custom domains
const result = await client.login();
```

## Additional Recommendations

### 1. Ensure HTTPS Everywhere
Make sure your custom domain serves all resources over HTTPS:
- CSS files
- JavaScript files
- Images
- Fonts

### 2. CSP Header Configuration
If you control your custom domain, ensure CSP headers allow:
```http
Content-Security-Policy: style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' https:;
```

### 3. Custom Authentication Pages
Consider implementing custom authentication pages using Kinde's hosted page feature for better control over styling.

### 4. Testing
Test your authentication flow on:
- Android devices with different WebView versions
- Different Android versions
- Various network conditions

## Debugging

The SDK provides helpful logging when custom domains are detected:

```
Custom domain detected - applying CSP handling for Android
For custom domains on Android, if you still experience CSS loading issues:

1. Ensure your custom domain serves all resources over HTTPS
2. Check that CSP headers allow 'unsafe-inline' for styles
3. Consider using Kinde's default domain as a fallback
4. Implement custom authentication pages if needed

Current URL: https://your-custom-domain.com/login
```

## Troubleshooting

If you still experience issues:

1. **Check Network Tab**: Use browser dev tools to see which resources are being blocked
2. **Verify CSP Headers**: Ensure your custom domain's CSP headers are permissive enough
3. **Test with Default Domain**: Temporarily switch to `yourapp.kinde.com` to confirm the issue is domain-specific
4. **Contact Support**: If issues persist, contact Kinde support with specific error details

## Security Considerations

The enhanced browser options are designed to be secure while allowing necessary resources to load. However, always ensure:
- All resources are served over HTTPS
- CSP headers are properly configured
- Regular security audits of your custom domain
