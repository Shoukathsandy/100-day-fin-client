import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFinance, today } from '@/context/FinanceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plus, Eye, IndianRupee, Calendar, CheckCircle2, XCircle, Clock
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

function progressColor(pct: number) {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 50) return 'bg-yellow-500'
  return 'bg-blue-500'
}

export default function Loans() {
  const { loans, customers, entries, loading } = useFinance()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const filterCustomer = params.get('customerId')

  const todayStr = today()

  const filtered = loans.filter(l =>
    (!filterCustomer || l.customerId === filterCustomer)
  )

  const activeLoans = filtered.filter(l => l.status === 'active')
  const closedLoans = filtered.filter(l => l.status === 'closed')

  function loanStats(loanId: string, loanAmount: number, dailyAmount: number, startDate: string, endDate: string) {
    const loanEntries = entries.filter(e => e.loanId === loanId)
    const paid = loanEntries.filter(e => e.type === 'payment').reduce((s, e) => s + e.amount, 0)
    const missed = loanEntries.filter(e => e.type === 'missed').length
    const paymentDays = loanEntries.filter(e => e.type === 'payment').length
    const pending = loanAmount - paid
    const progress = Math.min(100, Math.round((paid / loanAmount) * 100))

    // Days elapsed since start
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date(todayStr)
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
    const elapsed = Math.max(0, Math.min(totalDays, Math.round((now.getTime() - start.getTime()) / 86400000) + 1))
    const isOverdue = todayStr > endDate && paid < loanAmount

    return { paid, missed, pending, progress, paymentDays, elapsed, totalDays, isOverdue, dailyAmount }
  }

  function renderLoanCard(loan: typeof loans[0]) {
    const customer = customers.find(c => c.id === loan.customerId)
    const stats = loanStats(loan.id, loan.loanAmount, loan.dailyAmount, loan.startDate, loan.endDate)

    return (
      <Card key={loan.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-base leading-tight">{customer?.name ?? 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">{customer?.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              {stats.isOverdue && (
                <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                  Overdue
                </span>
              )}
              {loan.status === 'closed' && (
                <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                  Closed
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs h-7"
                onClick={() => navigate(`/dashboard/loans/${loan.id}`)}
              >
                <Eye className="h-3 w-3" />
                View
              </Button>
            </div>
          </div>

          {/* Amount info */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Loan</p>
              <p className="font-semibold">₹{loan.loanAmount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Collected</p>
              <p className="font-semibold text-green-600">₹{stats.paid.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Pending</p>
              <p className="font-semibold text-orange-600">₹{stats.pending.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats.paymentDays} days paid</span>
              <span>{stats.progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressColor(stats.progress)}`}
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>

          {/* Date + stats row */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {loan.startDate} → {loan.endDate}
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              ₹{loan.dailyAmount}/day
            </span>
            {stats.missed > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="h-3 w-3" />
                {stats.missed} missed
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-7 w-16" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loans</h1>
          <p className="text-sm text-muted-foreground">
            {activeLoans.length} active · {closedLoans.length} closed
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/loans/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Loan
        </Button>
      </div>

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <h2 className="font-semibold text-sm">Active Loans</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeLoans.map(renderLoanCard)}
          </div>
        </div>
      )}

      {/* Closed Loans */}
      {closedLoans.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm text-muted-foreground">Closed Loans</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-75">
            {closedLoans.map(renderLoanCard)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <IndianRupee className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No loans yet</p>
          <p className="text-sm mb-4">Create your first loan to get started</p>
          <Button onClick={() => navigate('/dashboard/loans/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Loan
          </Button>
        </div>
      )}
    </div>
  )
}
