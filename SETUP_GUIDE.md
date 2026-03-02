# Pure Pools CRM - Complete Setup Guide

## What You Need Before Starting

This system requires several API keys and integrations. Here's what you need to obtain:

### 1. Supabase (Database) - ✅ ALREADY CONFIGURED
Your Supabase database is already set up and connected. No action needed.

### 2. OpenAI API Key (For AI Email Parsing) - ⚠️ REQUIRED
**Why:** To automatically extract customer info from emails
**Cost:** Pay-as-you-go, ~$0.003 per email processed (using GPT-4o-mini)
**Get it here:** https://platform.openai.com/api-keys

1. Go to https://platform.openai.com/api-keys
2. Sign in to your OpenAI account
3. Click "Create new secret key"
4. Give it a name like "Pure Pools CRM"
5. Copy the key (starts with `sk-`)

### 3. Google OAuth (For Gmail & Calendar) - ⚠️ REQUIRED
**Why:** To sync emails and receive calendar webhooks
**Cost:** Free
**Get it here:** https://console.cloud.google.com/

#### Detailed Steps:

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Enable "Gmail API"
   - Enable "Google Calendar API"

3. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Name it "Pure Pools CRM"

4. **Configure OAuth Consent Screen**
   - Go to "OAuth consent screen"
   - Choose "External"
   - Fill in:
     - App name: Pure Pools CRM
     - User support email: your email
     - Developer contact: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.labels`
     - `https://www.googleapis.com/auth/calendar.readonly`

5. **Set Authorized Redirect URIs**
   - In your OAuth client settings, add:
     - Development: `http://localhost:3000/api/auth/google/callback`
     - Production: `https://your-domain.com/api/auth/google/callback`

6. **Copy Your Credentials**
   - Client ID (looks like: `123456789-abc.apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-abc123xyz`)

## Setting Up Environment Variables

### Option 1: Local Development (.env file)

Edit your `.env` file and add these keys:

```bash
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://aoftunmonnaunwcziikf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI API Key (Required for email parsing)
OPENAI_API_KEY=sk-your-key-here

# Google OAuth (Required for Gmail/Calendar)
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# NextAuth (Generate a random string)
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### Option 2: Production (Netlify)

1. Go to your Netlify site settings
2. Navigate to "Environment Variables"
3. Add each variable one by one:
   - `OPENAI_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` (use your production URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (get from Supabase dashboard)

## Getting Your Supabase Service Role Key

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the "service_role" key (NOT the anon key)
5. Add it to your `.env` file

## First-Time Setup Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Deploy Edge Function
The email parsing function needs to be deployed to Supabase:

1. Go to your Supabase dashboard
2. Navigate to Edge Functions
3. The function `parse-warranty-email` should be deployed automatically
4. If not, it will be deployed on first email sync

### Step 3: Create Gmail Label
1. Open Gmail
2. Go to Settings → Labels
3. Create a new label: `PP_Warranty_CRM_Upload`
4. (Optional) Apply this label to existing warranty emails

### Step 4: Connect Google Account
1. Start your app: `npm run dev`
2. Log in to the CRM
3. Go to Settings page
4. Click "Connect Google Account"
5. Authorize the app

### Step 5: Test Email Sync
1. Go to Emails page
2. Click "Sync Gmail"
3. System will process all emails with the `PP_Warranty_CRM_Upload` label

## What Works Without API Keys

Currently working without additional setup:
- ✅ Database (Supabase already configured)
- ✅ Customer management
- ✅ Warranty pipeline (manual entry)
- ✅ Scheduler
- ✅ Basic exports

Features requiring API keys:
- ❌ Email sync (needs Google OAuth)
- ❌ AI email parsing (needs Anthropic API)
- ❌ AI-powered exports (needs Anthropic API)
- ❌ Calendar webhooks (needs Google OAuth)

## Cost Breakdown

**Monthly costs for typical usage:**
- Supabase: Free tier (includes database + auth + storage)
- OpenAI API: ~$2-5/month (1000+ emails processed with GPT-4o-mini)
- Google APIs: Free
- Netlify hosting: Free tier

**Total: ~$2-5/month**

## Testing the System

### Test Email Sync
1. Send yourself a test warranty email
2. Label it `PP_Warranty_CRM_Upload`
3. Go to Emails page → Sync Gmail
4. Check if customer/warranty was created

### Test Photo Upload
1. Open warranty claim on mobile
2. Tap "Add Photos"
3. Take a photo
4. Verify it appears in the claim

### Test Export
1. Add some test customers
2. Go to Exports page
3. Select "All Customers"
4. Download CSV

## Troubleshooting

### "Gmail sync is not yet configured"
- You haven't connected Google OAuth yet
- Go to Settings → Connect Google Account

### "AI query generation failed"
- Your OpenAI API key is missing or invalid
- Check your `.env` file

### Photos not uploading
- Check Supabase Storage bucket `warranty-photos` exists
- Verify bucket has public access enabled

### Edge function errors
- Check Supabase Edge Function logs
- Verify `OPENAI_API_KEY` is set in Supabase secrets

## Security Checklist

Before going to production:
- [ ] All API keys added to Netlify (not committed to git)
- [ ] NEXTAUTH_SECRET is a random 32+ character string
- [ ] Google OAuth redirect URI matches production domain
- [ ] Supabase Row Level Security enabled on all tables
- [ ] Test authentication flow end-to-end

## Getting Help

If you run into issues:
1. Check the browser console for errors
2. Check Supabase Edge Function logs
3. Verify all environment variables are set correctly
4. Test each integration individually

## Next Steps After Setup

1. **Import Historical Data**
   - Label 50-100 old warranty emails
   - Sync and verify AI extraction accuracy
   - Adjust any customer data as needed

2. **Configure Calendar Webhook**
   - Add webhook URL to your AI assistant
   - Test with a dummy appointment
   - Verify warranty moves to "Scheduled"

3. **Train Your Team**
   - Show mobile photo upload workflow
   - Demonstrate warranty pipeline stages
   - Practice export for calling lists

4. **Set Up Routine**
   - Weekly: Export warranty expiring soon
   - Daily: Sync new emails
   - As needed: Photo documentation on-site
