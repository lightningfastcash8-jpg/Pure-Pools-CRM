# AI Agent Troubleshooting Guide

## Current Status

All code fixes have been applied. The "fetch failed" error you're seeing is almost certainly because **the dev server needs to be restarted** to pick up the new environment variables.

## What Was Fixed

### 1. Supabase Client Initialization
- ✅ Fixed API route to create Supabase client inside the request handler (not at module level)
- ✅ Updated to use proper server-side Supabase client from `@/lib/supabase/server`
- ✅ Pass Supabase client to `executeToolCall` function

### 2. Environment Variables
- ✅ Added `SUPABASE_SERVICE_ROLE_KEY` to `.env`
- ✅ Verified `OPENAI_API_KEY` is present and valid (164 characters, starts with `sk-proj-`)
- ✅ All Supabase credentials are in place

### 3. Error Handling
- ✅ Added comprehensive logging throughout the request flow
- ✅ Added API key format validation
- ✅ Added request body parsing error handling
- ✅ Improved error messages shown to users

### 4. Diagnostic Endpoints
- ✅ Created `/api/test` - Simple health check
- ✅ Created `/api/ai/health` - Full system health check (OpenAI + Supabase)
- ✅ Added GET endpoint to `/api/ai/ask` for quick verification

## Critical Next Steps

### STEP 1: Restart Your Dev Server
This is **MANDATORY**. Environment variable changes require a server restart.

Stop your current dev server and restart it:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### STEP 2: Verify API Routes Are Accessible

Open these URLs in your browser (while dev server is running):

1. **Basic Test**: http://localhost:3000/api/test
   - Should return: `{"status":"ok",...}`

2. **AI Health Check**: http://localhost:3000/api/ai/health
   - Should return: `{"openai":{"status":"ok"},"supabase":{"status":"ok"},...}`

3. **AI Ask Status**: http://localhost:3000/api/ai/ask
   - Should return: `{"status":"ok","message":"AI Ask API is running",...}`

If ANY of these fail, check the terminal for error messages.

### STEP 3: Test the AI Agent

1. Go to http://localhost:3000/agent
2. Open browser DevTools Console (F12)
3. Type a simple question: "Hello"
4. Watch BOTH:
   - **Browser console** - Shows fetch requests and responses
   - **Terminal** - Shows server-side logs

## What to Look For

### In Browser Console:
```
Preparing to call AI API...
API URL: /api/ai/ask
Request body size: XXX
Making fetch request...
Fetch completed, status: 200  <-- This means it worked!
```

### In Terminal:
```
=== AI API Route Called ===
Supabase client created
=== AI Request Started ===
Question: Hello
Environment check: { hasKey: true, keyPrefix: 'sk-proj-3p', ... }
OpenAI API key validated successfully
Calling OpenAI API...
OpenAI API response status: 200
```

## Common Issues

### "fetch failed" Error
**Cause**: Dev server hasn't restarted, or API route isn't loading
**Fix**:
1. Restart dev server completely
2. Check terminal for any startup errors
3. Try accessing `/api/test` directly

### "Invalid API key" Error
**Cause**: OpenAI key is incorrect or expired
**Fix**:
1. Go to https://platform.openai.com/api-keys
2. Generate a new key
3. Replace the key in `.env`
4. Restart dev server

### "Supabase query error"
**Cause**: Supabase credentials are incorrect
**Fix**: Check `/api/ai/health` endpoint for specific error message

## Detailed Logging

The system now logs extensively. If something fails, you'll see:

1. **Exactly where it failed** (parsing, validation, OpenAI call, etc.)
2. **What the error was** (specific message, status code)
3. **Environment state** (which keys are present, their lengths)

## Files Modified

- `.env` - Added SUPABASE_SERVICE_ROLE_KEY
- `app/api/ai/ask/route.ts` - Complete rewrite with proper client handling
- `app/agent/page.tsx` - Added detailed logging
- `app/api/ai/health/route.ts` - NEW health check endpoint
- `app/api/test/route.ts` - NEW simple test endpoint

## Still Having Issues?

1. Check the browser console AND terminal logs
2. Try the diagnostic endpoints (`/api/test`, `/api/ai/health`)
3. Verify environment variables are loading: Check `/api/test` response
4. Make sure you restarted the dev server after ANY `.env` changes

The detailed logs will tell you exactly what's wrong now.
