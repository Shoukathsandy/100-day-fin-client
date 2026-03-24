import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '@/context/FinanceContext'
import type { Customer } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import {
  Pencil, Trash2, Plus, User, Phone, MapPin, CreditCard,
  Loader2, UserPlus, AlertTriangle,
} from 'lucide-react'

const EMPTY = { name: '', phone: '', address: '', panCard: '' }

export default function Customers() {
  const { customers, loans, loading, addCustomer, updateCustomer, deleteCustomer } = useFinance()
  const navigate = useNavigate()

  const [modalOpen,     setModalOpen]     = useState(false)
  const [editing,       setEditing]       = useState<Customer | null>(null)
  const [form,          setForm]          = useState(EMPTY)
  const [search,        setSearch]        = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [formError,     setFormError]     = useState('')

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  function openAdd() {
    setEditing(null); setForm(EMPTY); setFormError(''); setModalOpen(true)
  }
  function openEdit(c: Customer) {
    setEditing(c); setForm({ name: c.name, phone: c.phone, address: c.address, panCard: c.panCard }); setFormError(''); setModalOpen(true)
  }
  function closeModal() { if (!saving) setModalOpen(false) }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true); setFormError('')
    try {
      editing ? await updateCustomer(editing.id, form) : await addCustomer(form)
      setModalOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deleteCustomer(id); setConfirmDelete(null)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  function activeLoansCount(customerId: string) {
    return loans.filter(l => l.customerId === customerId && l.status === 'active').length
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1"><Skeleton className="h-7 w-32" /><Skeleton className="h-4 w-40" /></div>
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-16" /></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-36" />
                <div className="flex gap-2 pt-2"><Skeleton className="h-8 flex-1" /><Skeleton className="h-8 flex-1" /></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers.length} total customers</p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-xl shadow-sm shadow-primary/20">
          <Plus className="h-4 w-4" />Add Customer
        </Button>
      </div>

      <Input placeholder="Search by name or phone..." value={search}
        onChange={e => setSearch(e.target.value)} className="max-w-sm rounded-xl" />

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
              <Card key={c.id} className="hover:shadow-md transition-shadow rounded-2xl border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
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
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost"
                        className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 pt-0">
                  {c.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />{c.phone}
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{c.address}</span>
                    </div>
                  )}
                  {c.panCard && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5 shrink-0" />{c.panCard}
                    </div>
                  )}
                  <div className="pt-2 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs rounded-lg"
                      onClick={() => navigate(`/dashboard/loans/create?customerId=${c.id}`)}>
                      <CreditCard className="h-3.5 w-3.5" />New Loan
                    </Button>
                    {active > 0 && (
                      <Button size="sm" variant="secondary" className="flex-1 text-xs rounded-lg"
                        onClick={() => navigate(`/dashboard/loans?customerId=${c.id}`)}>
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

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen} onClose={closeModal}
        title={editing ? 'Edit Customer' : 'Add Customer'}
        description={editing ? 'Update customer details below.' : 'Fill in the details to add a new customer.'}
        icon={<UserPlus className="h-5 w-5" />}
        iconColor="bg-primary/10 text-primary"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
            <Input id="name" placeholder="e.g. Ravi Kumar" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" placeholder="e.g. 9876543210" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="e.g. 12 Main Street, Chennai" value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="panCard">PAN Card</Label>
            <Input id="panCard" placeholder="e.g. ABCDE1234F" value={form.panCard}
              onChange={e => setForm(f => ({ ...f, panCard: e.target.value }))} className="rounded-xl" />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="submit" className="flex-1 rounded-xl" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Save Changes' : 'Add Customer'}
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={confirmDelete !== null}
        onClose={() => !deleting && setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        title="Delete Customer?"
        description="This will permanently delete the customer and cannot be undone."
        confirmLabel="Delete" confirmVariant="destructive" loading={deleting}
        icon={<AlertTriangle className="h-5 w-5" />}
        iconColor="bg-destructive/10 text-destructive"
      />
    </div>
  )
}
