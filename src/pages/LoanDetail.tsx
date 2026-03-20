import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFinance, addDays, today } from '@/context/FinanceContext'
import type { LoanEntry } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  ArrowLeft, CheckCircle2, XCircle, Plus, Pencil, Trash2,
  IndianRupee, AlertTriangle, CalendarDays, Loader2,
} from 'lucide-react'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = []
  let cur = start
  while (cur <= end) {
    dates.push(cur)
    cur = addDays(cur, 1)
  }
  return dates
}

function dayNum(dateStr: string, startDate: string) {
  const s = new Date(startDate), d = new Date(dateStr)
  return Math.round((d.getTime() - s.getTime()) / 86400000) + 1
}

type EntrySheet =
  | { mode: 'add'; date: string }
  | { mode: 'edit'; entry: LoanEntry }
  | null

export default function LoanDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    getLoanById, getCustomerById, getEntriesForLoan,
    addEntry, updateEntry, deleteEntry, updateLoan, closeLoan,
  } = useFinance()

  const loan = getLoanById(id!)
  const todayStr = today()

  const [sheet, setSheet] = useState<EntrySheet>(null)
  const [entryForm, setEntryForm] = useState({ amount: '', type: 'payment' as LoanEntry['type'], note: '', date: '' })
  const [tab, setTab] = useState<'grid' | 'list'>('grid')
  const [confirmClose, setConfirmClose] = useState(false)
  const [showExtend, setShowExtend] = useState(false)
  const [extendDays, setExtendDays] = useState('')
  const [saving, setSaving] = useState(false)

  if (!loan) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Loan not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/loans')}>
          Back to Loans
        </Button>
      </div>
    )
  }

  const customer = getCustomerById(loan.customerId)
  const loanEntries = getEntriesForLoan(loan.id)
  const entryByDate = new Map(loanEntries.map(e => [e.date, e]))

  const originalDates = dateRange(loan.startDate, loan.endDate)
  const extendedDates = loanEntries.filter(e => e.date > loan.endDate).map(e => e.date).sort()
  const allDates = [...originalDates, ...extendedDates]

  // Stats
  const totalPaid = loanEntries.filter(e => e.type === 'payment').reduce((s, e) => s + e.amount, 0)
  const totalAdj  = loanEntries.filter(e => e.type === 'adjustment').reduce((s, e) => s + e.amount, 0)
  const missedCount = loanEntries.filter(e => e.type === 'missed').length
  const payDays     = loanEntries.filter(e => e.type === 'payment').length
  const pending     = Math.max(0, loan.loanAmount - totalPaid - totalAdj)
  const progressPct = Math.min(100, Math.round(((totalPaid + totalAdj) / loan.loanAmount) * 100))
  const pastMissing = originalDates.filter(d => d < todayStr && !entryByDate.has(d))

  // Sheet helpers
  function openAdd(date: string) {
    const existing = entryByDate.get(date)
    if (existing) { openEdit(existing); return }
    setEntryForm({ amount: String(loan!.dailyAmount), type: 'payment', note: '', date })
    setSheet({ mode: 'add', date })
  }

  function openEdit(entry: LoanEntry) {
    setEntryForm({ amount: String(entry.amount), type: entry.type, note: entry.note ?? '', date: entry.date })
    setSheet({ mode: 'edit', entry })
  }

  async function handleEntrySubmit(e: FormEvent) {
    e.preventDefault()
    if (!sheet) return
    setSaving(true)
    try {
      const amount = parseFloat(entryForm.amount) || 0
      if (sheet.mode === 'add') {
        await addEntry({
          loanId: loan!.id,
          date: entryForm.date,
          amount,
          type: entryForm.type,
          note: entryForm.note || undefined,
        })
      } else {
        await updateEntry(sheet.entry.id, {
          amount,
          type: entryForm.type,
          note: entryForm.note || undefined,
        })
      }
      setSheet(null)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(entryId: string) {
    setSaving(true)
    try {
      await deleteEntry(entryId)
      setSheet(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkMissed(date: string) {
    try {
      await addEntry({ loanId: loan!.id, date, amount: 0, type: 'missed' })
    } catch (err) {
      console.error(err)
    }
  }

  async function handleExtend(e: FormEvent) {
    e.preventDefault()
    const days = parseInt(extendDays)
    if (!days || days <= 0) return
    setSaving(true)
    try {
      await updateLoan(loan!.id, {
        endDate: addDays(loan!.endDate, days),
        totalDays: loan!.totalDays + days,
      })
      setExtendDays('')
      setShowExtend(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleClose() {
    setSaving(true)
    try {
      await closeLoan(loan!.id)
      setConfirmClose(false)
    } finally {
      setSaving(false)
    }
  }

  function dayStatus(date: string) {
    const e = entryByDate.get(date)
    if (e) return e.type
    if (date < todayStr) return 'missing'
    if (date === todayStr) return 'today'
    return 'upcoming'
  }

  function cellCls(status: string) {
    switch (status) {
      case 'payment':    return 'bg-green-500 text-white'
      case 'missed':     return 'bg-red-400 text-white'
      case 'adjustment': return 'bg-blue-400 text-white'
      case 'missing':    return 'bg-orange-200 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
      case 'today':      return 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
      default:           return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/loans')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{customer?.name ?? 'Unknown'}</h1>
          <p className="text-sm text-muted-foreground">
            {loan.startDate} → {loan.endDate} · {loan.totalDays} days · ₹{loan.dailyAmount}/day
            {loan.status === 'closed' && (
              <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">Closed</span>
            )}
          </p>
        </div>
        {loan.status === 'active' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowExtend(true)}>
              <CalendarDays className="h-3.5 w-3.5" />Extend
            </Button>
            <Button
              variant="outline" size="sm"
              className="gap-1 text-xs text-destructive hover:text-destructive"
              onClick={() => setConfirmClose(true)}
            >
              Close Loan
            </Button>
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Loan Amount', value: fmt(loan.loanAmount), cls: '' },
          { label: 'Collected',   value: fmt(totalPaid + totalAdj), cls: 'text-green-600' },
          { label: 'Pending',     value: fmt(pending), cls: 'text-orange-600' },
          { label: 'Missed Days', value: String(missedCount + pastMissing.length), cls: 'text-red-500' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-lg font-bold ${k.cls}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{payDays} days paid</span>
          <span className="font-medium">{progressPct}% recovered</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Today CTA */}
      {loan.status === 'active' && !entryByDate.has(todayStr) && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-3">
          <div className="flex-1">
            <p className="text-sm font-medium">Today's collection pending</p>
            <p className="text-xs text-muted-foreground">{todayStr} · {fmt(loan.dailyAmount)} due</p>
          </div>
          <Button size="sm" className="gap-1" onClick={() => openAdd(todayStr)}>
            <Plus className="h-3.5 w-3.5" />Add
          </Button>
          <Button
            size="sm" variant="outline"
            className="gap-1 text-red-600 border-red-300"
            onClick={() => handleMarkMissed(todayStr)}
          >
            <XCircle className="h-3.5 w-3.5" />Missed
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-1">
        {(['grid', 'list'] as const).map(t => (
          <button
            key={t}
            className={`text-sm px-3 py-1 rounded-t font-medium capitalize transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setTab(t)}
          >
            {t === 'grid' ? 'Day Grid' : 'Entry List'}
          </button>
        ))}
      </div>

      {/* ── DAY GRID ── */}
      {tab === 'grid' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {allDates.map(date => {
              const status = dayStatus(date)
              const n = dayNum(date, loan.startDate)
              const isExt = date > loan.endDate
              const entry = entryByDate.get(date)

              return (
                <button
                  key={date}
                  onClick={() => loan.status === 'active' ? openAdd(date) : entry ? openEdit(entry) : undefined}
                  title={`Day ${n} · ${date}${entry ? ' · ' + fmt(entry.amount) : ''}`}
                  className={`relative h-10 w-10 rounded-lg text-xs font-semibold transition-all hover:opacity-80 hover:scale-105 active:scale-95 ${cellCls(status)} ${isExt ? 'ring-2 ring-blue-400' : ''}`}
                >
                  {n}
                  {isExt && (
                    <span className="absolute -top-1 -right-1 text-[8px] bg-blue-500 text-white rounded-full w-3 h-3 flex items-center justify-center">E</span>
                  )}
                </button>
              )
            })}
            {loan.status === 'active' && (
              <button
                onClick={() => openAdd(addDays(loan.endDate, extendedDates.length + 1))}
                className="h-10 w-10 rounded-lg border-2 border-dashed border-blue-400 text-blue-500 text-xs flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950/20"
                title="Add extended day"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {[
              ['bg-green-500', 'Paid'], ['bg-red-400', 'Missed'], ['bg-blue-400', 'Adjusted'],
              ['bg-orange-200', 'No entry (past)'], ['bg-primary', 'Today'], ['bg-muted', 'Upcoming'],
            ].map(([cls, label]) => (
              <span key={label} className="flex items-center gap-1">
                <span className={`inline-block h-3 w-3 rounded ${cls}`} />{label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── ENTRY LIST ── */}
      {tab === 'list' && (
        <div className="space-y-2">
          {/* Missing days */}
          {pastMissing.length > 0 && (
            <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                    {pastMissing.length} past day{pastMissing.length > 1 ? 's' : ''} with no entry
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pastMissing.slice(0, 10).map(d => (
                    <div key={d} className="flex items-center gap-1 text-xs border rounded px-1.5 py-0.5 bg-background">
                      <span>{d}</span>
                      {loan.status === 'active' && (
                        <>
                          <button className="text-green-600" onClick={() => openAdd(d)}>
                            <CheckCircle2 className="h-3 w-3" />
                          </button>
                          <button className="text-red-500" onClick={() => handleMarkMissed(d)}>
                            <XCircle className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                  {pastMissing.length > 10 && (
                    <span className="text-xs text-muted-foreground self-center">+{pastMissing.length - 10} more</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {loan.status === 'active' && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => openAdd(todayStr)}>
              <Plus className="h-3.5 w-3.5" />Add Entry
            </Button>
          )}

          {loanEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No entries yet</p>
          ) : (
            <div className="space-y-1.5">
              {[...loanEntries].sort((a, b) => b.date.localeCompare(a.date)).map(entry => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${entry.type === 'payment' ? 'bg-green-500' : entry.type === 'missed' ? 'bg-red-400' : 'bg-blue-400'}`} />
                    <div>
                      <p className="text-sm font-medium">
                        Day {dayNum(entry.date, loan.startDate)} · {entry.date}
                        {entry.date > loan.endDate && <span className="ml-1 text-xs text-blue-500">(ext)</span>}
                      </p>
                      {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${entry.type === 'payment' ? 'text-green-600' : entry.type === 'missed' ? 'text-red-500' : 'text-blue-500'}`}>
                        {entry.type === 'missed' ? '—' : fmt(entry.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{entry.type}</p>
                    </div>
                    {loan.status === 'active' && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(entry)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ENTRY SHEET ── */}
      <Sheet open={sheet !== null} onOpenChange={o => { if (!o && !saving) setSheet(null) }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{sheet?.mode === 'edit' ? 'Edit Entry' : 'Add Entry'}</SheetTitle>
            {sheet && <p className="text-sm text-muted-foreground">Day {dayNum(entryForm.date, loan.startDate)} · {entryForm.date}</p>}
          </SheetHeader>
          <form onSubmit={handleEntrySubmit} className="space-y-4 mt-6">
            {sheet?.mode === 'add' && (
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={entryForm.date} onChange={e => setEntryForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['payment', 'missed', 'adjustment'] as const).map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => setEntryForm(f => ({ ...f, type: t, amount: t === 'missed' ? '0' : f.amount }))}
                    className={`rounded-lg border py-2 text-xs font-medium capitalize transition-colors ${
                      entryForm.type === t
                        ? t === 'payment' ? 'bg-green-500 text-white border-green-500'
                          : t === 'missed' ? 'bg-red-400 text-white border-red-400'
                          : 'bg-blue-400 text-white border-blue-400'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >{t}</button>
                ))}
              </div>
            </div>
            {entryForm.type !== 'missed' && (
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number" min="0" className="pl-9"
                    value={entryForm.amount}
                    onChange={e => setEntryForm(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Input
                placeholder="e.g. partial payment, advance..."
                value={entryForm.note}
                onChange={e => setEntryForm(f => ({ ...f, note: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save
              </Button>
              {sheet?.mode === 'edit' && (
                <Button type="button" variant="destructive" size="icon" disabled={saving}
                  onClick={() => handleDelete((sheet as { mode: 'edit'; entry: LoanEntry }).entry.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setSheet(null)} disabled={saving}>Cancel</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── EXTEND SHEET ── */}
      <Sheet open={showExtend} onOpenChange={o => { if (!saving) setShowExtend(o) }}>
        <SheetContent>
          <SheetHeader><SheetTitle>Extend Loan</SheetTitle></SheetHeader>
          <form onSubmit={handleExtend} className="space-y-4 mt-6">
            <p className="text-sm text-muted-foreground">Current end: <strong>{loan.endDate}</strong></p>
            <div className="space-y-1.5">
              <Label>Additional Days</Label>
              <Input
                type="number" min="1" placeholder="e.g. 5"
                value={extendDays}
                onChange={e => setExtendDays(e.target.value)}
                required
              />
              {extendDays && parseInt(extendDays) > 0 && (
                <p className="text-xs text-muted-foreground">New end: {addDays(loan.endDate, parseInt(extendDays))}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Extend
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowExtend(false)} disabled={saving}>Cancel</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── CLOSE CONFIRM ── */}
      {confirmClose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="font-semibold text-lg mb-2">Close this loan?</h3>
            <p className="text-sm text-muted-foreground mb-4">No new entries can be added after closing.</p>
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" disabled={saving} onClick={handleClose}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Close Loan
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmClose(false)} disabled={saving}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
