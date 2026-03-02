"use client"

import { AppLayout } from '@/components/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface Email {
  id: string
  from_name?: string
  from_email?: string
  subject?: string
  received_at?: string
  processed_status: string
  label_name?: string
  created_at: string
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadEmails()
  }, [])

  const loadEmails = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('emails_raw')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setEmails(data)
    }
    setLoading(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/gmail/sync', { method: 'POST' })
      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || 'Sync completed')
        loadEmails()
      } else {
        toast.error(result.error || 'Sync failed')
      }
    } catch (error) {
      toast.error('Failed to sync emails')
    } finally {
      setSyncing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'parsed': return 'bg-green-100 text-green-800'
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'needs_review': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Inbox</h1>
            <p className="text-gray-600 mt-1">Warranty requests from Gmail</p>
          </div>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading emails...</div>
        ) : (
          <div className="space-y-3">
            {emails.map((email) => (
              <Card key={email.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-medium">{email.from_name || email.from_email}</div>
                      <Badge className={getStatusColor(email.processed_status)}>
                        {email.processed_status}
                      </Badge>
                      {email.label_name && (
                        <Badge variant="outline">{email.label_name}</Badge>
                      )}
                    </div>

                    <div className="text-sm text-gray-900 mb-1">
                      {email.subject}
                    </div>

                    <div className="text-xs text-gray-500">
                      {email.received_at && format(new Date(email.received_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {emails.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No emails found. Configure Gmail OAuth in Settings to start syncing.
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
