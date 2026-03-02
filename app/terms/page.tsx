export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Pure Pools CRM, you accept and agree to be bound by the terms
              and provisions of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Use License</h2>
            <p>
              Permission is granted to temporarily use Pure Pools CRM for personal or commercial use.
              This is the grant of a license, not a transfer of title.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password.
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Prohibited Uses</h2>
            <p>You may not use our service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>For any unlawful purpose</li>
              <li>To violate any regulations or laws</li>
              <li>To harm or exploit minors</li>
              <li>To transmit any harmful code or malware</li>
              <li>To interfere with the security of the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Disclaimer</h2>
            <p>
              The service is provided "as is" without warranties of any kind, either express or implied.
              We do not warrant that the service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p>
              In no event shall Pure Pools CRM or its suppliers be liable for any damages arising out
              of the use or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the service immediately, without
              prior notice, for any reason, including breach of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any
              material changes by updating the date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Information</h2>
            <p>
              Questions about the Terms of Service should be sent to:
            </p>
            <p className="mt-2 font-medium">jimmy@purepoolsinc.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
