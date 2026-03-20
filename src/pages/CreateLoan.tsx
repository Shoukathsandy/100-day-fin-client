import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFinance, addDays } from '@/context/FinanceContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, IndianRupee, Calendar, User, Loader2 } from 'lucide-react'

export default function CreateLoan() {
  const { customers, addLoan } = useFinance()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [form, setForm] = useState({
    customerId: params.get('customerId') ?? '',
    loanAmount: '',
    dailyAmount: '',
    totalDays: '100',
    startDate: new Date().toISOString().slice(0, 10),
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleLoanAmountChange(val: string) {
    const amount = parseFloat(val) || 0
    const days = parseInt(form.totalDays) || 100
    const daily = days > 0 ? Math.ceil(amount / days) : 0
    setForm(f => ({ ...f, loanAmount: val, dailyAmount: daily > 0 ? String(daily) : '' }))
  }

  function handleDaysChange(val: string) {
    const days = parseInt(val) || 100
    const amount = parseFloat(form.loanAmount) || 0
    const daily = days > 0 ? Math.ceil(amount / days) : 0
    setForm(f => ({ ...f, totalDays: val, dailyAmount: daily > 0 ? String(daily) : '' }))
  }

  const endDate = form.startDate
    ? addDays(form.startDate, (parseInt(form.totalDays) || 100) - 1)
    : ''

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.customerId) return setError('Please select a customer.')
    const loanAmount  = parseFloat(form.loanAmount)
    const dailyAmount = parseFloat(form.dailyAmount)
    const totalDays   = parseInt(form.totalDays)

    if (!loanAmount  || loanAmount  <= 0) return setError('Enter a valid loan amount.')
    if (!dailyAmount || dailyAmount <= 0) return setError('Enter a valid daily amount.')
    if (!totalDays   || totalDays   <= 0) return setError('Enter valid total days.')

    setSaving(true)
    try {
      const loan = await addLoan({
        customerId: form.customerId,
        loanAmount,
        dailyAmount,
        totalDays,
        startDate: form.startDate,
        endDate,
      })
      navigate(`/dashboard/loans/${loan.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create loan')
      setSaving(false)
    }
  }

  const selectedCustomer = customers.find(c => c.id === form.customerId)

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Loan</h1>
          <p className="text-sm text-muted-foreground">Set up a 100-day repayment plan</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loan Details</CardTitle>
          <CardDescription>Daily collection = Loan Amount ÷ Total Days</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Customer */}
            <div className="space-y-1.5">
              <Label htmlFor="customer">Customer *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  id="customer"
                  className="w-full pl-9 pr-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.customerId}
                  onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                  required
                >
                  <option value="">-- Select customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` (${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCustomer && (
                <p className="text-xs text-muted-foreground pl-1">
                  {selectedCustomer.address || 'No address on file'}
                </p>
              )}
              {customers.length === 0 && (
                <p className="text-xs text-amber-600">
                  No customers yet.{' '}
                  <button type="button" className="underline" onClick={() => navigate('/dashboard/customer')}>
                    Add a customer first
                  </button>
                </p>
              )}
            </div>

            {/* Loan Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="loanAmount">Loan Amount (₹) *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="loanAmount" type="number" min="1"
                  placeholder="e.g. 10000" className="pl-9"
                  value={form.loanAmount}
                  onChange={e => handleLoanAmountChange(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Total Days */}
            <div className="space-y-1.5">
              <Label htmlFor="totalDays">Total Days *</Label>
              <Input
                id="totalDays" type="number" min="1" max="365"
                value={form.totalDays}
                onChange={e => handleDaysChange(e.target.value)}
                required
              />
            </div>

            {/* Daily Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="dailyAmount">Daily Collection (₹) *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dailyAmount" type="number" min="1"
                  placeholder="Auto-calculated" className="pl-9"
                  value={form.dailyAmount}
                  onChange={e => setForm(f => ({ ...f, dailyAmount: e.target.value }))}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">You can override the auto-calculated value</p>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate" type="date" className="pl-9"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Summary */}
            {form.loanAmount && form.dailyAmount && form.startDate && (
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wide">Summary</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground">Loan Amount</p>
                    <p className="font-semibold">₹{parseFloat(form.loanAmount || '0').toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily Collection</p>
                    <p className="font-semibold">₹{parseFloat(form.dailyAmount || '0').toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-semibold">{form.startDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p className="font-semibold">{endDate}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Total Repayment</p>
                    <p className="font-semibold text-primary">
                      ₹{(parseFloat(form.dailyAmount || '0') * (parseInt(form.totalDays) || 100)).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Loan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
