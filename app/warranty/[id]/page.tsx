"use client"

import { AppLayout } from '@/components/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Camera, Save, ArrowLeft, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

interface WarrantyClaim {
  id: string
  stage: string
  priority: string
  vendor: string
  claim_notes: string
  manufacturer_claim_number: string
  scheduled_date: string | null
  filed_date: string | null
  photo_urls: string[]
  created_at: string
  customer: any
  work_order: any
  parsed_data: any
}

const stages = [
  { value: 'queued', label: 'Queued' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ready_to_file', label: 'Ready to File' },
  { value: 'filed', label: 'Filed' },
  { value: 'closed', label: 'Closed' },
]

export default function WarrantyClaimDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [claim, setClaim] = useState<WarrantyClaim | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')
  const [stage, setStage] = useState('')
  const [claimNumber, setClaimNumber] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadClaim()
    }
  }, [params.id])

  const loadClaim = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('warranty_claims')
      .select(`
        *,
        customer:customers(*),
        work_order:work_orders(*)
      `)
      .eq('id', params.id)
      .maybeSingle()

    if (!error && data) {
      setClaim(data as any)
      setNotes(data.claim_notes || '')
      setStage(data.stage)
      setClaimNumber(data.manufacturer_claim_number || '')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const updates: any = {
      claim_notes: notes,
      stage,
      manufacturer_claim_number: claimNumber || null,
    }

    if (stage === 'filed' && !claim?.filed_date) {
      updates.filed_date = new Date().toISOString()
    }

    const { error } = await supabase
      .from('warranty_claims')
      .update(updates)
      .eq('id', params.id)

    if (!error) {
      toast.success('Warranty claim updated successfully')
      await loadClaim()
    } else {
      toast.error('Failed to update claim')
    }
    setSaving(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const uploadedUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${params.id}/${Date.now()}_${i}.${fileExt}`

      const { error: uploadError, data } = await supabase.storage
        .from('warranty-photos')
        .upload(fileName, file)

      if (!uploadError && data) {
        const { data: urlData } = supabase.storage
          .from('warranty-photos')
          .getPublicUrl(data.path)

        uploadedUrls.push(urlData.publicUrl)
      }
    }

    if (uploadedUrls.length > 0) {
      const currentPhotos = claim?.photo_urls || []
      const { error } = await supabase
        .from('warranty_claims')
        .update({ photo_urls: [...currentPhotos, ...uploadedUrls] })
        .eq('id', params.id)

      if (!error) {
        toast.success(`${uploadedUrls.length} photo(s) uploaded`)
        await loadClaim()
      }
    }

    setUploading(false)
  }

  const removePhoto = async (url: string) => {
    const updatedPhotos = (claim?.photo_urls || []).filter(p => p !== url)
    const { error } = await supabase
      .from('warranty_claims')
      .update({ photo_urls: updatedPhotos })
      .eq('id', params.id)

    if (!error) {
      toast.success('Photo removed')
      await loadClaim()
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading claim...</div>
        </div>
      </AppLayout>
    )
  }

  if (!claim) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Claim not found</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/warranty')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">
                    {claim.customer?.first_name} {claim.customer?.last_name}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Created {format(new Date(claim.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Claim Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Stage</Label>
                    <Select value={stage} onValueChange={setStage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map(s => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Manufacturer Claim Number</Label>
                    <Input
                      value={claimNumber}
                      onChange={(e) => setClaimNumber(e.target.value)}
                      placeholder="Enter claim number from manufacturer system"
                    />
                  </div>

                  {claim.scheduled_date && (
                    <div>
                      <Label>Scheduled Date</Label>
                      <div className="text-sm mt-1">
                        {format(new Date(claim.scheduled_date), 'PPP')}
                      </div>
                    </div>
                  )}

                  {claim.filed_date && (
                    <div>
                      <Label>Filed Date</Label>
                      <div className="text-sm mt-1">
                        {format(new Date(claim.filed_date), 'PPP')}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>Add notes about this warranty claim</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={8}
                    placeholder="Enter notes, observations, or additional information..."
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Photos</CardTitle>
                      <CardDescription>Upload photos from the job site</CardDescription>
                    </div>
                    <div>
                      <input
                        type="file"
                        id="photo-upload"
                        multiple
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <Button
                        size="sm"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        disabled={uploading}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Add Photos'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {claim.photo_urls && claim.photo_urls.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {claim.photo_urls.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePhoto(url)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No photos uploaded yet. Add photos when you're on-site.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">Name</Label>
                    <div className="font-medium">
                      {claim.customer?.first_name} {claim.customer?.last_name}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Email</Label>
                    <div className="text-sm">{claim.customer?.email}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Phone</Label>
                    <div className="text-sm">{claim.customer?.phone}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Address</Label>
                    <div className="text-sm">
                      {claim.customer?.address}<br />
                      {claim.customer?.city}, {claim.customer?.state} {claim.customer?.zip}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Equipment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {claim.work_order?.model_number && (
                    <div>
                      <Label className="text-xs text-gray-500">Model Number</Label>
                      <div className="text-sm font-mono">{claim.work_order.model_number}</div>
                    </div>
                  )}
                  {claim.work_order?.serial_number && (
                    <div>
                      <Label className="text-xs text-gray-500">Serial Number</Label>
                      <div className="text-sm font-mono">{claim.work_order.serial_number}</div>
                    </div>
                  )}
                  {claim.work_order?.installed_by && (
                    <div>
                      <Label className="text-xs text-gray-500">Installed By</Label>
                      <div className="text-sm">{claim.work_order.installed_by}</div>
                    </div>
                  )}
                  {claim.work_order?.install_date && (
                    <div>
                      <Label className="text-xs text-gray-500">Install Date</Label>
                      <div className="text-sm">
                        {format(new Date(claim.work_order.install_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {claim.work_order?.product_issue && (
                <Card>
                  <CardHeader>
                    <CardTitle>Issue Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {claim.work_order.product_issue}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Claim Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">Vendor</Label>
                    <div className="text-sm">{claim.vendor}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Priority</Label>
                    <Badge variant={claim.priority === 'high' ? 'destructive' : 'default'}>
                      {claim.priority}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
