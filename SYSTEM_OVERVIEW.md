# Pure Pools CRM - System Overview

## New Features Implemented

### 1. Mobile-First PWA Experience
The app is now a Progressive Web App that can be installed on your phone's home screen:
- **Install on iPhone/Android**: Use "Add to Home Screen" and get a native app experience
- **Wave Logo Icon**: Your Pure Pools wave logo appears as the app icon
- **Mobile-Optimized**: Touch-friendly interface, mobile navigation menu
- **Offline Ready**: Service worker registered for future offline capabilities

### 2. Email-Powered Database Building
Automatically build your customer database from Gmail:
- **Gmail Label**: `PP_Warranty_CRM_Upload`
- **Automatic Sync**: System pulls all emails with this label
- **AI Processing**: Claude AI extracts customer info, equipment details, and issues
- **Smart Parsing**: Creates customers, work orders, and warranty claims automatically

**Workflow:**
1. Label your historical warranty emails in Gmail with `PP_Warranty_CRM_Upload`
2. Go to Emails page → Click "Sync Gmail"
3. System processes each email and creates:
   - Customer record (if new)
   - Work order with equipment details
   - Warranty claim in "Queued" status
4. New emails with this label are automatically processed going forward

### 3. Streamlined Warranty Pipeline
**Updated stages:** Queued → Scheduled → Ready to File → Filed → Closed

**Changes Made:**
- Removed redundant "Intake" stage
- Mobile-optimized Kanban board
- Photos can be added on-site during service
- Notes field for tracking progress and manufacturer interactions

**On-Site Mobile Workflow:**
1. Open warranty claim on your phone
2. View all customer and equipment details
3. Add photos using phone camera (stored securely in Supabase)
4. Add notes about findings
5. Update status to "Ready to File" when done
6. Enter manufacturer claim number when filed

### 4. Calendar Integration Webhook
Your AI assistant can automatically update warranty status:

**Endpoint:** `POST /api/webhooks/calendar`

**Payload:**
```json
{
  "customerId": "customer-uuid",
  "scheduledDate": "2024-03-15T10:00:00Z"
}
```

**Behavior:**
- Finds warranty claims in "Queued" status for that customer
- Automatically moves to "Scheduled" status
- Records the scheduled date

### 5. AI-Powered Export System
Export custom customer lists using natural language:

**Examples:**
- "All heater customers"
- "Customers with warranty expiring in next 3 months"
- "All Pentair equipment owners in Cape Coral"
- "Customers whose warranty expires before summer"

**Features:**
- AI interprets your question
- Generates SQL query safely
- Returns results instantly
- Export to CSV with one click
- Use for calling lists, email campaigns, targeted service offers

**Quick Export Templates:**
- All Customers
- Warranty Expiring Soon (next 3 months)
- Active Warranty Claims

### 6. Warranty Expiration Tracking
Built into the export system:
- Track customers with expiring warranties
- Export lists for extended warranty sales
- Filter by equipment type, date range, location
- Perfect for proactive customer outreach

### 7. Complete Photo Management
**On-Site Photo Upload:**
- Native camera integration on mobile
- Upload multiple photos at once
- Photos stored permanently in Supabase Storage
- View all photos in warranty claim detail page
- Remove photos if needed

**Storage:**
- Bucket: `warranty-photos`
- Organized by claim ID
- Public URLs for easy sharing with manufacturers

### 8. Enhanced Claim Detail View
Complete warranty information in one place:
- Customer contact info
- Equipment details (model, serial, install date)
- Issue description from original email
- AI-parsed data
- Photo gallery
- Notes history
- Manufacturer claim number
- All dates (created, scheduled, filed)
- Status management

## Technical Implementation

### Database Schema Updates
New fields added to `warranty_claims`:
- `email_id` - Links to source Gmail message
- `gmail_message_id` - For deduplication
- `parsed_data` - JSON field with AI-extracted data
- `scheduled_date` - When appointment is booked
- `photo_urls` - Array of uploaded photo URLs
- `filed_date` - When submitted to manufacturer
- `manufacturer_claim_number` - Tracking number from vendor

### Edge Functions
**parse-warranty-email** (Deployed)
- Processes incoming warranty emails
- Extracts customer and equipment data using Claude AI
- Creates database records automatically
- Handles deduplication

### API Routes
- `/api/gmail/sync` - Syncs emails with PP_Warranty_CRM_Upload label
- `/api/webhooks/calendar` - Receives scheduling updates
- `/api/ai/ask` - Natural language database queries
- `/api/auth/google/*` - OAuth flow for Gmail

### Mobile Optimizations
- Responsive navigation with hamburger menu
- Touch-optimized buttons and controls
- Mobile-first card layouts
- Safe area insets for iPhone notch
- Viewport meta tags configured
- PWA manifest for app installation

## Usage Guide

### Setting Up Gmail Sync
1. Go to Settings page
2. Click "Connect Google Account"
3. Authorize Gmail access
4. Create label `PP_Warranty_CRM_Upload` in Gmail
5. Label existing warranty emails
6. Click "Sync Gmail" in the app
7. System processes all labeled emails

### Working a Warranty Claim (Mobile)
1. Open Pure Pools app from home screen
2. Go to Warranty Pipeline
3. Tap on a claim card
4. Review customer and equipment details
5. When on-site:
   - Tap "Add Photos"
   - Take pictures of equipment, serial numbers, issues
   - Add notes about your findings
6. Update status to "Ready to File"
7. File claim with manufacturer
8. Enter their claim number
9. Update status to "Filed"
10. Close claim when resolved

### Exporting Customer Lists
1. Go to Exports page
2. Type your query in natural language
3. Click "Search with AI"
4. Review results
5. Click "Export" to download CSV
6. Use CSV for:
   - Calling lists for your AI assistant
   - Email marketing campaigns
   - Targeted service promotions
   - Warranty extension sales

### Calendar Integration
Configure your AI assistant to call:
```bash
POST https://your-domain.com/api/webhooks/calendar
Content-Type: application/json

{
  "customerId": "{{customer_id}}",
  "scheduledDate": "{{appointment_time}}"
}
```

This automatically moves the warranty claim to "Scheduled" status.

## Security & Privacy

- All data encrypted in transit (HTTPS)
- Row Level Security enabled on all tables
- Photos stored in secure Supabase buckets
- OAuth tokens never exposed to client
- API keys server-side only
- Authenticated access required for all features

## Performance

- Static page generation where possible
- Optimized image loading
- Efficient database queries
- Edge function for fast email processing
- Client-side caching of customer data

## Future Enhancements

Potential additions:
- Push notifications for new warranty emails
- Offline mode for field work without internet
- Bulk photo upload from phone gallery
- Direct manufacturer API integrations
- Automated follow-up reminders
- Service report generation from warranty claims

## Support

For setup assistance or questions:
1. Check the main README.md for environment setup
2. Review Supabase dashboard for data issues
3. Check browser console for errors
4. Review Edge Function logs in Supabase
