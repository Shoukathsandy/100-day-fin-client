import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '@/context/FinanceContext'
import type { Customer } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Pencil, Trash2, Plus, User, Phone, MapPin, CreditCard, Loader2 } from 'lucide-react'

const EMPTY = { name: '', phone: '', address: '' }

export default function Customers() {
  const { customers, loans, addCustomer, updateCustomer, deleteCustomer } = useFinance()
  const navigate = useNavigate()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState('')

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setFormError('')
    setSheetOpen(true)
  }

  function openEdit(c: Customer) {
    setEditing(c)
    setForm({ name: c.name, phone: c.phone, address: c.address })
    setFormError('')
    setSheetOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await updateCustomer(editing.id, form)
      } else {
        await addCustomer(form)
      }
      setSheetOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deleteCustomer(id)
      setConfirmDelete(null)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  function activeLoansCount(customerId: string) {
    return loans.filter(l => l.customerId === customerId && l.status === 'active').length
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers.length} total customers</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name or phone..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No customers found</p>
          <p className="text-sm">Add your first customer to get started</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => {
            const active = activeLoansCount(c.id)
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base">{c.name}</CardTitle>
                        {active > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">
                            {active} active loan{active > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 pt-0">
                  {c.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {c.phone}
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}
                  <div className="pt-2 flex gap-2">
                    <Button
                      size="sm" variant="outline"
                      className="flex-1 gap-1 text-xs"
                      onClick={() => navigate(`/dashboard/loans/create?customerId=${c.id}`)}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      New Loan
                    </Button>
                    {active > 0 && (
                      <Button
                        size="sm" variant="secondary"
                        className="flex-1 text-xs"
                        onClick={() => navigate(`/dashboard/loans?customerId=${c.id}`)}
                      >
                        View Loans
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={o => { if (!saving) setSheetOpen(o) }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Customer' : 'Add Customer'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Ravi Kumar"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="e.g. 12 Main Street, Chennai"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? 'Save Changes' : 'Add Customer'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="font-semibold text-lg mb-2">Delete Customer?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete the customer.
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive" className="flex-1"
                disabled={deleting}
                onClick={() => handleDelete(confirmDelete)}
              >
                {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
