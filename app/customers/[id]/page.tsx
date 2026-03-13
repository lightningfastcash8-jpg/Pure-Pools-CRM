"use client"

import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2, X, Check } from 'lucide-react'
import Link from 'next/link'
import { Customer } from '@/types/database'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address_line1: '',
    city: '',
    state: '',
    zip: '',
  })

  useEffect(() => {
    loadCustomer()
  }, [params.id])

  const loadCustomer = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (error || !data) {
      toast.error('Customer not found')
      router.push('/customers')
      return
    }

    setCustomer(data)
    setFormData({
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      phone: data.phone || '',
      address_line1: data.address_line1 || '',
      city: data.city || '',
      state: data.state || '',
      zip: data.zip || '',
    })
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name) {
      toast.error('First and last name are required')
      return
    }

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('customers')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        phone: formData.phone || null,
        address_line1: formData.address_line1 || null,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
      })
      .eq('id', params.id)

    setSaving(false)

    if (error) {
      toast.error('Failed to update customer')
      return
    }

    toast.success('Customer updated')
    setEditing(false)
    loadCustomer()
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', params.id)

    if (error) {
      toast.error('Failed to delete customer')
      return
    }

    toast.success('Customer deleted')
    router.push('/customers')
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">Loading...</div>
      </AppLayout>
    )
  }

  if (!customer) return null

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/customers" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Customers
          </Link>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Check className="h-4 w-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {customer.first_name} {customer.last_name}
              <div className="flex gap-1">
                {customer.tags?.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address_line1">Address</Label>
                  <Input
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP</Label>
                    <Input
                      id="zip"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Email</div>
                    <div>{customer.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Phone</div>
                    <div>{customer.phone || '-'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Address</div>
                  <div>
                    {customer.address_line1 && <div>{customer.address_line1}</div>}
                    {(customer.city || customer.state || customer.zip) && (
                      <div>
                        {customer.city}{customer.city && customer.state && ', '}{customer.state} {customer.zip}
                      </div>
                    )}
                    {!customer.address_line1 && !customer.city && '-'}
                  </div>
                </div>

                <div className="text-xs text-gray-400 pt-4 border-t">
                  Created: {new Date(customer.created_at).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
