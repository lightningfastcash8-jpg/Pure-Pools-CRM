# Pure Pools Ops CRM

A production-ready operations and warranty management system for Pure Pools, built with Next.js, TypeScript, and Supabase.

## Features

- **Warranty Pipeline Management** - Replace manual Google Drive workflow with a digital Kanban pipeline (Intake → Queued → Scheduled → Ready to File → Filed → Closed)
- **Gmail Integration** - Automatically sync warranty requests from Gmail with OAuth
- **Google Calendar Integration** - View existing calendar events to avoid scheduling conflicts
- **Heater Annual Scheduler** - Schedule and manage heater annual service appointments with constraints (May 15 - Sep 15, max 4/day, blocked dates)
- **Customer Management** - Comprehensive customer database with assets, work orders, and program enrollments
- **Service Reports** - Digital checklists, photo uploads, and PDF report generation
- **AI Agent** - Ask questions about warranties, equipment, and service history (OpenAI powered)
- **Export Tools** - Export customer segments for email/SMS campaigns with E.164 phone formatting
- **Mobile-Friendly** - Responsive design for field use

## Tech Stack

- **Frontend**: Next.js 13, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (warranty photos, report photos, PDFs)
- **AI**: OpenAI API (optional)

## Prerequisites

- Node.js 18+ and npm
- Supabase account (database already provisioned)
- Google Cloud Console project (for Gmail/Calendar OAuth)
- OpenAI API key (optional, for AI features)

## Installation

1. **Clone the repository**
   ```bash
   cd project
   npm install
   ```

2. **Environment Variables**

   The `.env` file is already created with Supabase credentials. You need to add:

   ```env
   # Supabase (Already configured)
   NEXT_PUBLIC_SUPABASE_URL=https://aoftunmonnaunwcziikf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...

   # Get from Supabase Dashboard → Settings → API
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

   # Get from OpenAI (optional)
   OPENAI_API_KEY=your-openai-api-key-here

   # Google OAuth (see setup instructions below)
   GOOGLE_CLIENT_ID=your-google-client-id-here
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here
   NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

   # Generate a random secret
   NEXTAUTH_SECRET=your-nextauth-secret-here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Database Setup**

   All database migrations have been applied automatically. The database includes:
   - customers, assets, work_orders, warranty_claims, warranty_photos
   - program_enrollments, appointments, schedule_settings, blocked_ranges
   - checklist_templates, service_reports, report_photos
   - emails_raw, extraction_results, oauth_tokens
   - Storage buckets: warranty-photos, report-photos, reports, branding

4. **Google OAuth Setup**

   a. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create a new project or select existing

   b. **Enable APIs**
   - Enable Gmail API
   - Enable Google Calendar API

   c. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Add authorized redirect URI:
     ```
     http://localhost:3000/api/auth/google/callback
     https://your-production-domain.com/api/auth/google/callback
     ```
   - Copy Client ID and Client Secret to `.env`

   d. **Configure OAuth Consent Screen**
   - Add scopes: `gmail.readonly`, `calendar.readonly`
   - Add test users (your email address)

5. **Create First User**

   The app uses Supabase Auth. Create your first user:
   - Run `npm run dev`
   - Visit http://localhost:3000
   - You'll be redirected to the login page
   - Since there's no signup page, create user via Supabase Dashboard:
     - Go to Authentication → Users → Add User
     - Or use Supabase SQL Editor:
       ```sql
       -- This will be auto-hashed by Supabase
       INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
       VALUES ('your-email@purepools.com', crypt('your-password', gen_salt('bf')), now());
       ```

## Running the Application

**Development**
```bash
npm run dev
```

Visit http://localhost:3000

**Production Build**
```bash
npm run build
npm start
```

**Type Check**
```bash
npm run typecheck
```

## Application Structure

```
/app
  /api
    /ai/ask - AI agent endpoint
    /auth/google - Google OAuth flow
    /gmail/sync - Email sync endpoint
  /customers - Customer management
  /dashboard - Main dashboard
  /emails - Email inbox
  /exports - CSV export tools
  /login - Authentication
  /scheduler - Heater annual scheduler
  /settings - OAuth connections and settings
  /warranty - Warranty pipeline (Kanban)
/components
  /ui - shadcn/ui components
  AppLayout.tsx - Main app wrapper
  AppNav.tsx - Navigation sidebar
/contexts
  AuthContext.tsx - Authentication context
/lib
  /supabase - Supabase client setup
/types
  database.ts - TypeScript types
```

## Key Workflows

### 1. Warranty Pipeline

Replaces the manual Google Drive folder workflow:

1. **Intake** - New warranty requests (from Gmail sync)
2. **Queued** - Accepted and needs scheduling
3. **Scheduled** - Date set, pending service
4. **Ready to File** - Service complete, photos collected
5. **Filed** - Submitted to vendor
6. **Closed** - Completed

### 2. Gmail Sync

1. Go to Settings → Connect Gmail
2. Authorize OAuth access
3. System will poll for emails with label `PP_Warranty_CRM_Upload`
4. Click "Sync Now" to manually trigger sync
5. Emails are parsed and converted to warranty claims automatically

### 3. Equipment Parsing

The system safely handles all equipment types:
- Always stores `model_raw` (original value)
- Attempts `model_normalized` (uppercase, stripped)
- Never rejects unknown suffixes
- Falls back to `asset_type = 'other'` with low confidence
- Supports: heater, pump, filter, automation, sensor, valve, other

### 4. Heater Annual Scheduling

1. Configure season (May 15 - Sep 15) in settings
2. Set blocked dates (default: July 1-7)
3. Max 4 appointments per day enforced
4. Auto-Fill button schedules enrolled customers
5. Drag-and-drop to reschedule (feature ready for implementation)

## Gmail Label Setup

Create a Gmail label called `PP_Warranty_CRM_Upload`:

1. In Gmail, click the gear icon → "See all settings"
2. Go to "Labels" tab
3. Click "Create new label"
4. Name it: `PP_Warranty_CRM_Upload`
5. Apply this label to warranty request emails
6. The system will automatically sync these emails

## Email Dispatch Template

The system expects emails to contain:
- Date
- Sent-in-from (requestor name)
- Requestor Email/Phone
- Homeowner Name/Phone/Email
- Site Address
- Model (equipment)
- Installation Date
- Installed By (builder/installer name)
- Product Issue (description)

## Service Reports

1. Navigate to work order
2. Complete digital checklist (15 pre-configured items)
3. Upload photos (serial number, issues)
4. Add service notes and recommendations
5. Generate PDF report (includes Pure Pools branding)
6. Email to customer (opens mailto link)

## Export Tools

Export customer data for campaigns:
- All Customers
- Customers with Phone (for SMS)
- Customers with Email (for email campaigns)

Phone numbers are normalized to E.164 format (+1 for US).

## AI Agent (Optional)

Once OpenAI API key is configured, ask questions like:
- "When does this warranty end?"
- "Have I worked on this pump before?"
- "Show me all heaters installed by [builder name]"

The AI is grounded in actual database records and shows sources.

## Security

- **RLS Enabled** - Row Level Security on all tables
- **Authenticated Access** - All data requires authentication
- **OAuth Tokens** - Stored securely server-side (not in localStorage)
- **No API Key Exposure** - Client-side code never sees service keys

## Mobile Usage

The app is fully responsive and designed for field use:
- Fast photo uploads from phone camera
- Mobile-optimized forms
- Touch-friendly Kanban interface
- Readable on small screens

## Support

For issues or questions:
1. Check Supabase logs for database errors
2. Check browser console for client errors
3. Check Next.js server logs for API errors

## Database Backups

Supabase provides automatic daily backups. To create a manual backup:
- Go to Supabase Dashboard → Database → Backups

## Deployment

**Recommended**: Deploy to Vercel or Netlify

**Vercel**:
```bash
npm install -g vercel
vercel
```

**Netlify**: Already configured with `netlify.toml`

Remember to:
- Add all environment variables in hosting dashboard
- Update `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` with production URL
- Add production redirect URI to Google Cloud Console

## License

Proprietary - Pure Pools of Southwest Florida, Inc.
