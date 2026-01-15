# Authentication Setup Guide

This guide provides step-by-step instructions for configuring social authentication (Apple and Google) in SpotCheck.

## Prerequisites

- Supabase project created
- Apple Developer account (for Apple Sign In)
- Google Cloud Console account (for Google Sign In)

---

## Step 1: Supabase Configuration

### 1.1 Enable Authentication Providers

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable the following providers:
   - **Email** (already enabled by default)
   - **Apple**
   - **Google**

---

## Step 2: Apple Sign In Setup

### 2.1 Apple Developer Console

1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles** → **Identifiers**
3. Select your App ID (or create one if needed)
4. Enable **Sign In with Apple** capability
5. Save the changes

### 2.2 Create Service ID

1. In Apple Developer Console, go to **Identifiers** → **Services IDs**
2. Click the **+** button to create a new Service ID
3. Fill in:
   - **Description**: SpotCheck Authentication
   - **Identifier**: `com.spotcheck.app.auth` (or your custom identifier)
4. Enable **Sign In with Apple**
5. Click **Configure** next to Sign In with Apple
6. Select your Primary App ID
7. Add **Return URLs**:
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
   ```
8. Save and continue

### 2.3 Create Key for Sign In with Apple

1. Go to **Keys** in Apple Developer Console
2. Click **+** to create a new key
3. Name it: "SpotCheck Apple Sign In Key"
4. Enable **Sign In with Apple**
5. Click **Configure** and select your Primary App ID
6. Click **Continue** and **Register**
7. **Download the key file** (`.p8` file) - you can only download this once!
8. Note the **Key ID**

### 2.4 Configure Supabase Apple Provider

1. In Supabase Dashboard, go to **Authentication** → **Providers** → **Apple**
2. Fill in:
   - **Services ID**: The Service ID you created (e.g., `com.spotcheck.app.auth`)
   - **Secret Key**: The contents of the `.p8` file you downloaded
   - **Key ID**: The Key ID from Apple Developer Console
   - **Team ID**: Your Apple Team ID (found in Apple Developer Console → Membership)

### 2.5 Add Redirect URL to Supabase

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
   spotcheck://
   ```

---

## Step 3: Google Sign In Setup

### 3.1 Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - **User Type**: External (for public apps)
   - **App name**: SpotCheck
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Click **Save and Continue**
   - Add scopes: `email`, `profile`, `openid`
   - Click **Save and Continue**
   - Add test users (optional for development)
   - Click **Save and Continue**

### 3.2 Create OAuth Client ID

1. In **Credentials**, click **Create Credentials** → **OAuth client ID**
2. Select **Web application**
3. Name: "SpotCheck Web Client"
4. Add **Authorized redirect URIs**:
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
   ```
5. Click **Create**
6. **Copy the Client ID and Client Secret**

### 3.3 Configure Supabase Google Provider

1. In Supabase Dashboard, go to **Authentication** → **Providers** → **Google**
2. Fill in:
   - **Client ID (for OAuth)**: The Client ID from Google Cloud Console
   - **Client Secret (for OAuth)**: The Client Secret from Google Cloud Console
3. Click **Save**

### 3.4 Add Redirect URL to Supabase

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Ensure the following is in **Redirect URLs**:
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
   spotcheck://
   ```

---

## Step 4: Environment Variables

Add these to your `.env` file (or Expo environment variables):

```env
EXPO_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
EXPO_PUBLIC_SUPABASE_REDIRECT_URL=spotcheck://
```

---

## Step 5: App Configuration

### 5.1 iOS (app.json)

The `expo-apple-authentication` plugin is already configured in `app.json`.

### 5.2 Android

For Google Sign In on Android, you may need to add the following to `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

**Note**: For V1, we're using Supabase OAuth which works via web redirect, so native Android Google Sign In configuration is optional.

---

## Step 6: Testing

### Test Apple Sign In

1. Run the app on an iOS device or simulator
2. Tap "Continue with Apple"
3. Authenticate with Face ID/Touch ID or Apple ID
4. Verify you're redirected to the app and logged in

### Test Google Sign In

1. Run the app
2. Tap "Continue with Google"
3. A web browser should open for Google authentication
4. After authentication, you should be redirected back to the app
5. Verify you're logged in

### Test Email Sign In

1. Tap "Create Account" or "Sign In"
2. Enter email and password
3. For new accounts, check email for verification link
4. Verify you can sign in

---

## Troubleshooting

### Apple Sign In Issues

- **"Sign in cancelled"**: User cancelled the authentication (this is expected)
- **"No identity token"**: Check that Sign In with Apple is enabled in your App ID
- **"Invalid client"**: Verify Service ID and Key configuration in Supabase

### Google Sign In Issues

- **Redirect URI mismatch**: Ensure the redirect URI in Google Cloud Console matches exactly with Supabase
- **"Access blocked"**: Check OAuth consent screen configuration
- **Web redirect not working**: Verify `EXPO_PUBLIC_SUPABASE_REDIRECT_URL` is set correctly

### General Issues

- **Session not persisting**: Check that SecureStore is properly configured in `lib/supabase.ts`
- **Auth state not updating**: Verify `AuthContext` is properly listening to auth state changes

---

## Security Notes

- Never commit `.p8` key files or Client Secrets to version control
- Use environment variables for all sensitive configuration
- Regularly rotate OAuth credentials
- Monitor authentication logs in Supabase Dashboard

---

## Support

For issues specific to:
- **Apple Sign In**: Check [Apple Developer Documentation](https://developer.apple.com/sign-in-with-apple/)
- **Google Sign In**: Check [Google Identity Documentation](https://developers.google.com/identity)
- **Supabase Auth**: Check [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
