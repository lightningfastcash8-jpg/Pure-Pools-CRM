export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, including your name, email address,
              and any other information you choose to provide when using our Pure Pools CRM service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your requests and transactions</li>
              <li>Send you technical notices and support messages</li>
              <li>Communicate with you about products, services, and events</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties
              without your consent, except as described in this privacy policy or as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Google API Services User Data Policy</h2>
            <p className="mb-4">
              Pure Pools CRM uses Google API Services to provide core functionality for our business operations.
              This section explains how we access, use, store, and share data from your Google account.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">5.1 Google Services We Use</h3>
            <p className="mb-2">Our application accesses the following Google services:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Gmail API</strong> - To read warranty-related emails from equipment manufacturers
                and automate warranty claim processing
              </li>
              <li>
                <strong>Google Calendar API</strong> - To view technician availability and manage service
                appointment scheduling
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">5.2 What Google Data We Access</h3>
            <p className="mb-2">We access the following data from your Google account:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Gmail Messages</strong> - We read email messages labeled "Warranty Work" to extract
                warranty claim information, equipment details, and manufacturer responses
              </li>
              <li>
                <strong>Gmail Metadata</strong> - We access email headers, sender information, and labels
                to identify and categorize warranty-related correspondence
              </li>
              <li>
                <strong>Calendar Events</strong> - We read calendar events to check technician availability
                and prevent scheduling conflicts
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">5.3 How We Use Google Data</h3>
            <p className="mb-2">We use your Google data exclusively for the following business purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Automated Warranty Processing</strong> - Extracting equipment serial numbers, model
                information, failure descriptions, and parts lists from manufacturer emails to create and
                update warranty claim records
              </li>
              <li>
                <strong>Service Scheduling</strong> - Checking technician calendar availability to display
                open time slots and prevent double-booking appointments
              </li>
              <li>
                <strong>Customer Service</strong> - Tracking warranty claim status updates and manufacturer
                communications to provide accurate information to customers
              </li>
            </ul>
            <p className="mt-2">
              <strong>We do NOT:</strong> Send emails on your behalf, modify your Gmail messages, delete
              calendar events, or access any Google data beyond what is explicitly described above.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">5.4 Data Storage and Retention</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                Google data is stored securely in our Supabase database with encryption at rest and in transit
              </li>
              <li>
                We extract and store only the specific warranty information needed for CRM operations (equipment
                details, claim status, manufacturer responses)
              </li>
              <li>
                Warranty claim data is retained for 7 years for business and warranty compliance purposes
              </li>
              <li>
                Calendar availability data is cached temporarily and automatically expires after 24 hours
              </li>
              <li>
                We do not store complete email contents or calendar event details beyond what is necessary
                for warranty processing
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">5.5 Data Sharing and Third Parties</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>We do NOT sell your Google data</strong> to any third parties
              </li>
              <li>
                <strong>We do NOT share your Google data</strong> with third parties except:
                <ul className="list-circle pl-6 mt-1 space-y-1">
                  <li>With your explicit consent</li>
                  <li>As required by law or legal process</li>
                  <li>To protect our rights, property, or safety</li>
                </ul>
              </li>
              <li>
                Google data is processed internally by our CRM application only
              </li>
              <li>
                We use Supabase for secure database hosting, which maintains SOC 2 Type II compliance
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">5.6 Limited Use Disclosure</h3>
            <p className="mb-2">
              Pure Pools CRM's use and transfer of information received from Google APIs adheres to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
            <p className="mt-2">
              This means we only use Google user data for the specific purposes disclosed in this privacy
              policy and do not use it for serving advertisements or any purposes unrelated to our CRM
              functionality.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">5.7 Your Control Over Google Data</h3>
            <p className="mb-2">You have complete control over your Google data:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Revoke Access</strong> - You can revoke our access to your Google account at any time
                by visiting your{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Account Permissions
                </a>{' '}
                page and removing Pure Pools CRM
              </li>
              <li>
                <strong>Disconnect Integration</strong> - You can disconnect the Gmail and Calendar integration
                from within the CRM settings at any time
              </li>
              <li>
                <strong>Data Deletion</strong> - If you revoke access or disconnect the integration, we will
                stop accessing your Google account immediately. Warranty data already extracted will be
                retained per our retention policy unless you request deletion
              </li>
              <li>
                <strong>Request Data Deletion</strong> - You can request deletion of all extracted Google
                data by contacting us at jimmy@purepoolsinc.com
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">5.8 Security of Google Data</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                All Google API communications use OAuth 2.0 authentication with secure token management
              </li>
              <li>
                OAuth tokens are encrypted and stored securely in our database
              </li>
              <li>
                Access to Google data is restricted to authorized application functions only
              </li>
              <li>
                We implement industry-standard security measures including encryption, access controls,
                and regular security audits
              </li>
              <li>
                All data transmission occurs over HTTPS with TLS encryption
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">5.9 Scope Justification</h3>
            <p className="mb-2">We request the following Google OAuth scopes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>https://www.googleapis.com/auth/gmail.addons.current.message.metadata</strong> -
                To read email headers and sender information when identifying warranty emails
              </li>
              <li>
                <strong>https://www.googleapis.com/auth/gmail.addons.current.message.readonly</strong> -
                To read the full content of warranty emails for data extraction
              </li>
              <li>
                <strong>https://www.googleapis.com/auth/calendar</strong> -
                To read calendar events for scheduling service appointments and checking technician availability
              </li>
            </ul>
            <p className="mt-2">
              These scopes are the minimum required to provide our warranty automation and scheduling
              features. We do not request broader permissions than necessary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of certain data collection</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our service and
              hold certain information to improve and analyze our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes
              by posting the new privacy policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy, please contact us at:
            </p>
            <p className="mt-2 font-medium">jimmy@purepoolsinc.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
