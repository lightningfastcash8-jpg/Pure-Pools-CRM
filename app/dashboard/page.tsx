"use client"

import { AppLayout } from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AlertCircle, Users, Calendar, CheckCircle } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeWarranties: 0,
    upcomingAppointments: 0,
    completedThisMonth: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const [
      { count: customers },
      { count: warranties },
      { count: appointments },
      { count: completed }
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('warranty_claims').select('*', { count: 'exact', head: true }).in('stage', ['intake', 'queued', 'scheduled']),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
      supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', new Date(new Date().setDate(1)).toISOString())
    ])

    setStats({
      totalCustomers: customers || 0,
      activeWarranties: warranties || 0,
      upcomingAppointments: appointments || 0,
      completedThisMonth: completed || 0
    })
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to Pure Pools Ops CRM</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Warranties</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeWarranties}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedThisMonth}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Activity tracking coming soon...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="/warranty" className="block p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="font-medium">View Warranty Pipeline</div>
                <div className="text-sm text-muted-foreground">Manage warranty claims</div>
              </a>
              <a href="/scheduler" className="block p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="font-medium">Schedule Appointments</div>
                <div className="text-sm text-muted-foreground">Manage heater annual services</div>
              </a>
              <a href="/customers" className="block p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="font-medium">Browse Customers</div>
                <div className="text-sm text-muted-foreground">View customer database</div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
