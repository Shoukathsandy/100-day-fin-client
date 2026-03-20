import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '@/context/FinanceContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Search } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

export default function LoanHistory() {
  const { loans, customers, entries } = useFinance()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all')
  const [sort, setSort] = useState<'date' | 'amount'>('date')

  function loanStats(loanId: string, loanAmount: number) {
    const paid = entries
      .filter(e => e.loanId === loanId && (e.type === 'payment' || e.type === 'adjustment'))
      .reduce((s, e) => s + e.amount, 0)
    return { paid, pending: Math.max(0, loanAmount - paid), pct: Math.round((paid / loanAmount) * 100) }
  }

  // Chart data — disbursed vs collected per customer
  const chartData = customers.map(c => {
    const cLoans = loans.filter(l => l.customerId === c.id)
    const disbursed = cLoans.reduce((s, l) => s + l.loanAmount, 0)
    const collected = entries
      .filter(e => cLoans.some(l => l.id === e.loanId) && (e.type === 'payment' || e.type === 'adjustment'))
      .reduce((s, e) => s + e.amount, 0)
    return { name: c.name.split(' ')[0], disbursed, collected }
  }).filter(d => d.disbursed > 0)

  let filtered = loans.filter(l => {
    const c = customers.find(cx => cx.id === l.customerId)
    const matchSearch = !search ||
      c?.name.toLowerCase().includes(search.toLowerCase()) ||
      c?.phone.includes(search)
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchStatus
  })

  if (sort === 'date') filtered = [...filtered].sort((a, b) => b.startDate.localeCompare(a.startDate))
  else filtered = [...filtered].sort((a, b) => b.loanAmount - a.loanAmount)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Loan History</h1>
        <p className="text-sm text-muted-foreground">All {loans.length} loans across {customers.length} customers</p>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Disbursed vs Collected per Customer</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  tickLine={false} axisLine={false} width={52}
                  tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value) => {
                    let amount = 0
                    if (typeof value === 'number') amount = value
                    else if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) amount = Number(value)
                    else if (Array.isArray(value) && value.length > 0) {
                      const first = value[0]
                      amount = typeof first === 'number' ? first : Number(first)
                    }
                    return `₹${Number.isFinite(amount) ? amount.toLocaleString('en-IN') : 0}`
                  }}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="disbursed" name="disbursed" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="collected" name="collected" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 w-48 text-sm"
          />
        </div>
        <div className="flex gap-1 rounded-md border p-0.5">
          {(['all', 'active', 'closed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-0.5 rounded text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as 'date' | 'amount')}
          className="h-8 rounded-md border bg-background px-2 text-xs focus:outline-none"
        >
          <option value="date">Sort: Date</option>
          <option value="amount">Sort: Amount</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Customer</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Loan Amount</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden sm:table-cell">Period</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Progress</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Paid</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs text-orange-500">Pending</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">No loans found</td>
              </tr>
            ) : (
              filtered.map(loan => {
                const customer = customers.find(c => c.id === loan.customerId)
                const stats = loanStats(loan.id, loan.loanAmount)
                const initials = customer?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '??'

                return (
                  <tr key={loan.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium leading-none">{customer?.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{customer?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                      <p>{loan.startDate}</p>
                      <p>{loan.endDate}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-24">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-7 shrink-0">{stats.pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">₹{stats.paid.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-orange-600 font-medium">₹{stats.pending.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        loan.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => navigate(`/dashboard/loans/${loan.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
