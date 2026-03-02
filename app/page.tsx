import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Pure Pools CRM
          </h1>
          <p className="text-xl text-slate-700 mb-8">
            A comprehensive customer relationship management system designed for pool service businesses.
            Manage customers, schedule appointments, track work orders, handle warranty claims, and streamline your pool service operations.
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Key Features</h2>
            <ul className="text-left space-y-3 text-slate-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Customer Management:</strong> Track customer information, assets, and service history</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Work Order Tracking:</strong> Create and manage service requests with detailed checklists</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Warranty Claims:</strong> Process and track warranty claims with photo documentation</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Appointment Scheduling:</strong> Schedule service appointments with customizable availability</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Email Integration:</strong> Parse and process warranty emails automatically</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>AI Assistant:</strong> Get intelligent help with business operations and knowledge queries</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center mb-12">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          <div className="text-sm text-slate-600 space-x-4">
            <Link href="/privacy" className="hover:text-blue-600 underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-blue-600 underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
