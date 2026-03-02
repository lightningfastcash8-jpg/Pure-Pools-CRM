# Google OAuth Setup Guide

## Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API and Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
   - Search for "Google Calendar API" and enable it

4. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Add authorized redirect URI: `https://aoftunmonnaunwcziikf.supabase.co/auth/v1/callback`
   - Click "Create"
   - Copy your **Client ID** and **Client Secret**

## Step 2: Configure in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/aoftunmonnaunwcziikf/auth/providers)
2. Click on "Google" in the providers list
3. Enable the Google provider
4. Paste your **Client ID** and **Client Secret**
5. Add these scopes (Supabase may add them automatically):
   ```
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   openid
   ```
6. For Gmail access, Supabase needs additional scopes. Add these in the "Additional Scopes" field:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/calendar.readonly
   ```
7. Click "Save"

## Step 3: Test the Integration

1. Go to your app's login page
2. Click "Sign in with Google"
3. Complete the Google OAuth flow
4. You should be redirected back to your app
5. Go to Settings page to verify connection status

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure the redirect URI in Google Cloud Console matches exactly: `https://aoftunmonnaunwcziikf.supabase.co/auth/v1/callback`

### "Error 400: redirect_uri_mismatch"
- Double-check the redirect URI in both Google Console and Supabase

### Gmail sync says "Please sign in with Google"
- Make sure you signed in using the Google button, not email/password
- The additional Gmail scopes must be configured in Supabase

### Still having issues?
- Check browser console for errors
- Verify Google APIs (Gmail, Calendar) are enabled in Google Cloud Console
- Make sure OAuth consent screen is configured
