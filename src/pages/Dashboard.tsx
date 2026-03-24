import { useNavigate } from 'react-router-dom'
import { useFinance, today } from '@/context/FinanceContext'
import KpiCard from '@/components/Dashboard.tsx/KPICards'
import DashboardChart from '@/components/Dashboard.tsx/DashboardChart'
import { IndianRupee, Users, Wallet, AlertTriangle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Dashboard() {
  const { customers, loans, entries, loading } = useFinance()
  const navigate = useNavigate()
  const todayStr = today()

  const activeLoans = loans.filter(l => l.status === 'active')

  const totalDisbursed = loans.reduce((s, l) => s + l.loanAmount, 0)
  const totalCollected = entries
    .filter(e => e.type === 'payment' || e.type === 'adjustment')
    .reduce((s, e) => s + e.amount, 0)
  const totalPending = activeLoans.reduce((s, l) => {
    const paid = entries
      .filter(e => e.loanId === l.id && (e.type === 'payment' || e.type === 'adjustment'))
      .reduce((x, e) => x + e.amount, 0)
    return s + Math.max(0, l.loanAmount - paid)
  }, 0)

  const overdueLoans = activeLoans.filter(l => todayStr > l.endDate)

  // Today's collections
  const todayEntries = entries.filter(e => e.date === todayStr && e.type === 'payment')
  const todayTotal = todayEntries.reduce((s, e) => s + e.amount, 0)

  // Recent entries (last 7 days)
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayStr)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  const weekData = week.map(date => ({
    date: date.slice(5),  // MM-DD
    amount: entries
      .filter(e => e.date === date && e.type === 'payment')
      .reduce((s, e) => s + e.amount, 0),
  }))

  // Upcoming due (active loans with no entry today)
  const dueTodayLoans = activeLoans.filter(l => !entries.some(e => e.loanId === l.id && e.date === todayStr))

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-48 w-full" /></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Quick actions */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" className="gap-1" onClick={() => navigate('/dashboard/loans/create')}>
          <Plus className="h-3.5 w-3.5" />
          New Loan
        </Button>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate('/dashboard/customer')}>
          <Plus className="h-3.5 w-3.5" />
          Add Customer
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Disbursed"
          value={`₹${totalDisbursed.toLocaleString('en-IN')}`}
          description={`${loans.length} loans total`}
          icon={IndianRupee}
          trend="up"
          trendValue={`${activeLoans.length} active`}
        />
        <KpiCard
          title="Total Collected"
          value={`₹${totalCollected.toLocaleString('en-IN')}`}
          description={totalDisbursed > 0 ? `${Math.round((totalCollected / totalDisbursed) * 100)}% recovered` : '—'}
          icon={Wallet}
          trend="up"
          trendValue={`Today: ₹${todayTotal.toLocaleString('en-IN')}`}
        />
        <KpiCard
          title="Pending Amount"
          value={`₹${totalPending.toLocaleString('en-IN')}`}
          description={`${activeLoans.length} active loans`}
          icon={Wallet}
          trend={overdueLoans.length > 0 ? 'down' : 'up'}
          trendValue={overdueLoans.length > 0 ? `${overdueLoans.length} overdue` : 'On track'}
        />
        <KpiCard
          title="Customers"
          value={customers.length}
          description={`${overdueLoans.length} overdue loan${overdueLoans.length !== 1 ? 's' : ''}`}
          icon={Users}
          trend={overdueLoans.length > 0 ? 'down' : 'up'}
          trendValue={`${activeLoans.length} active`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2">
          <DashboardChart data={weekData} />
        </div>

        {/* Due today */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Due Today ({dueTodayLoans.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dueTodayLoans.length === 0 ? (
              <p className="text-sm text-muted-foreground">All collections done for today!</p>
            ) : (
              dueTodayLoans.slice(0, 8).map(loan => {
                const customer = customers.find(c => c.id === loan.customerId)
                return (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted rounded px-2 py-1 -mx-2"
                    onClick={() => navigate(`/dashboard/loans/${loan.id}`)}
                  >
                    <span className="font-medium truncate">{customer?.name}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">₹{loan.dailyAmount}</span>
                  </div>
                )
              })
            )}
            {dueTodayLoans.length > 8 && (
              <p className="text-xs text-muted-foreground">+{dueTodayLoans.length - 8} more</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
