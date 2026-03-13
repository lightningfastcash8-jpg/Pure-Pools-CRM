"use client"

import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2, X, Check, Plus, Wrench } from 'lucide-react'
import Link from 'next/link'
import { Customer, Asset } from '@/types/database'

const ASSET_TYPES = ['Pool Pump', 'Pool Heater', 'Pool Filter', 'Salt System', 'Automation', 'Cleaner', 'Other']

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [assetForm, setAssetForm] = useState({
    asset_type: '',
    brand: '',
    model_raw: '',
    serial: '',
    install_date: '',
    installed_by: '',
    warranty_end_date: '',
    notes: '',
  })
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
    loadAssets()
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

  const loadAssets = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('assets')
      .select('*')
      .eq('customer_id', params.id)
      .order('created_at', { ascending: false })

    if (data) setAssets(data)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleAssetChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAssetForm(prev => ({
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

  const resetAssetForm = () => {
    setAssetForm({
      asset_type: '',
      brand: '',
      model_raw: '',
      serial: '',
      install_date: '',
      installed_by: '',
      warranty_end_date: '',
      notes: '',
    })
    setEditingAsset(null)
  }

  const openEditAsset = (asset: Asset) => {
    setEditingAsset(asset)
    setAssetForm({
      asset_type: asset.asset_type || '',
      brand: asset.brand || '',
      model_raw: asset.model_raw || '',
      serial: asset.serial || '',
      install_date: asset.install_date || '',
      installed_by: '',
      warranty_end_date: asset.warranty_end_date || '',
      notes: asset.notes || '',
    })
    setShowAddEquipment(true)
  }

  const handleSaveAsset = async () => {
    if (!assetForm.asset_type) {
      toast.error('Equipment type is required')
      return
    }

    const supabase = createClient()

    if (editingAsset) {
      const { error } = await supabase
        .from('assets')
        .update({
          asset_type: assetForm.asset_type,
          brand: assetForm.brand || null,
          model_raw: assetForm.model_raw || null,
          serial: assetForm.serial || null,
          install_date: assetForm.install_date || null,
          warranty_end_date: assetForm.warranty_end_date || null,
          notes: assetForm.notes || null,
        })
        .eq('id', editingAsset.id)

      if (error) {
        toast.error('Failed to update equipment')
        return
      }
      toast.success('Equipment updated')
    } else {
      const { error } = await supabase
        .from('assets')
        .insert({
          customer_id: params.id,
          asset_type: assetForm.asset_type,
          brand: assetForm.brand || null,
          model_raw: assetForm.model_raw || null,
          serial: assetForm.serial || null,
          install_date: assetForm.install_date || null,
          warranty_end_date: assetForm.warranty_end_date || null,
          notes: assetForm.notes || null,
          confidence: 1,
          source: 'manual',
          status: 'active',
        })

      if (error) {
        toast.error('Failed to add equipment')
        return
      }
      toast.success('Equipment added')
    }

    setShowAddEquipment(false)
    resetAssetForm()
    loadAssets()
  }

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Delete this equipment?')) return

    const supabase = createClient()
    const { error } = await supabase.from('assets').delete().eq('id', assetId)

    if (error) {
      toast.error('Failed to delete equipment')
      return
    }

    toast.success('Equipment deleted')
    loadAssets()
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

        <div className="space-y-6">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipment
              </CardTitle>
              <Dialog open={showAddEquipment} onOpenChange={(open) => {
                setShowAddEquipment(open)
                if (!open) resetAssetForm()
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Equipment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingAsset ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Equipment Type *</Label>
                      <Select
                        value={assetForm.asset_type}
                        onValueChange={(value) => setAssetForm(prev => ({ ...prev, asset_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSET_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Brand</Label>
                        <Input
                          name="brand"
                          value={assetForm.brand}
                          onChange={handleAssetChange}
                          placeholder="e.g., Pentair"
                        />
                      </div>
                      <div>
                        <Label>Model</Label>
                        <Input
                          name="model_raw"
                          value={assetForm.model_raw}
                          onChange={handleAssetChange}
                          placeholder="e.g., IntelliFlo VSF"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Serial Number</Label>
                      <Input
                        name="serial"
                        value={assetForm.serial}
                        onChange={handleAssetChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Install Date</Label>
                        <Input
                          name="install_date"
                          type="date"
                          value={assetForm.install_date}
                          onChange={handleAssetChange}
                        />
                      </div>
                      <div>
                        <Label>Warranty End</Label>
                        <Input
                          name="warranty_end_date"
                          type="date"
                          value={assetForm.warranty_end_date}
                          onChange={handleAssetChange}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Installed By</Label>
                      <Input
                        name="installed_by"
                        value={assetForm.installed_by}
                        onChange={handleAssetChange}
                        placeholder="Installer name"
                      />
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <textarea
                        name="notes"
                        value={assetForm.notes}
                        onChange={handleAssetChange}
                        rows={2}
                        className="w-full px-3 py-2 border rounded-md resize-none text-sm"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => {
                        setShowAddEquipment(false)
                        resetAssetForm()
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveAsset}>
                        {editingAsset ? 'Update' : 'Add'} Equipment
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No equipment registered for this customer
                </div>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div key={asset.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{asset.asset_type}</span>
                            <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                              {asset.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {asset.brand && <span>{asset.brand}</span>}
                            {asset.brand && asset.model_raw && <span> - </span>}
                            {asset.model_raw && <span>{asset.model_raw}</span>}
                          </div>
                          {asset.serial && (
                            <div className="text-xs text-gray-500 mt-1">S/N: {asset.serial}</div>
                          )}
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            {asset.install_date && (
                              <span>Installed: {new Date(asset.install_date).toLocaleDateString()}</span>
                            )}
                            {asset.warranty_end_date && (
                              <span className={new Date(asset.warranty_end_date) < new Date() ? 'text-red-500' : ''}>
                                Warranty: {new Date(asset.warranty_end_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {asset.notes && (
                            <div className="text-sm text-gray-600 mt-2 italic">{asset.notes}</div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditAsset(asset)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAsset(asset.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
