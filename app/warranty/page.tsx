"use client"

import { AppLayout } from '@/components/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'

interface WarrantyClaimWithDetails {
  id: string
  stage: string
  priority: string
  vendor: string
  created_at: string
  customer: any
  work_order: any
}

const stages = [
  { value: 'queued', label: 'Queued', color: 'bg-blue-100' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-purple-100' },
  { value: 'ready_to_file', label: 'Ready to File', color: 'bg-yellow-100' },
  { value: 'filed', label: 'Filed', color: 'bg-green-100' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-200' },
]

export default function WarrantyPage() {
  const [claims, setClaims] = useState<WarrantyClaimWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClaims()
  }, [])

  const loadClaims = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('warranty_claims')
      .select(`
        *,
        customer:customers(*),
        work_order:work_orders(*)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setClaims(data as any)
    }
    setLoading(false)
  }

  const getClaimsByStage = (stage: string) => {
    return claims.filter(claim => claim.stage === stage)
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-8 mt-14 md:mt-0">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Warranty Pipeline</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage warranty claims from queued to filing</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading warranty claims...</div>
        ) : (
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {stages.map((stage) => {
              const stageClaims = getClaimsByStage(stage.value)

              return (
                <div key={stage.value} className="flex-shrink-0 w-72 sm:w-80">
                  <div className={`${stage.color} rounded-t-lg p-3 border-b-2 border-gray-300`}>
                    <h3 className="font-semibold text-sm uppercase tracking-wide">
                      {stage.label}
                      <span className="ml-2 px-2 py-0.5 bg-white rounded-full text-xs">
                        {stageClaims.length}
                      </span>
                    </h3>
                  </div>

                  <div className="space-y-3 mt-3">
                    {stageClaims.map((claim) => (
                      <Link
                        key={claim.id}
                        href={`/warranty/${claim.id}`}
                      >
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="font-medium">
                                {claim.customer?.first_name} {claim.customer?.last_name}
                              </div>
                              {claim.priority === 'high' && (
                                <Badge variant="destructive" className="text-xs">High</Badge>
                              )}
                            </div>

                            <div className="text-sm text-gray-600">
                              {claim.customer?.city}, {claim.customer?.zip}
                            </div>

                            {claim.work_order?.installed_by && (
                              <div className="text-xs text-gray-500">
                                Installed by: {claim.work_order.installed_by}
                              </div>
                            )}

                            {claim.work_order?.product_issue && (
                              <div className="text-xs text-gray-700 line-clamp-2">
                                {claim.work_order.product_issue}
                              </div>
                            )}

                            <div className="text-xs text-gray-400">
                              {format(new Date(claim.created_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}

                    {stageClaims.length === 0 && (
                      <div className="text-center text-sm text-gray-400 py-8">
                        No claims in this stage
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
