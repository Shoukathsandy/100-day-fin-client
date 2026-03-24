import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Customer, Loan, LoanEntry } from '../types/finance'
import { customerApi, loanApi, entryApi } from '@/lib/api'

// ─── date helpers (kept here for backward compat, re-exported) ────────────────

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── context shape ────────────────────────────────────────────────────────────

interface FinanceCtx {
  customers: Customer[]
  loans: Loan[]
  entries: LoanEntry[]
  loading: boolean
  initialized: boolean
  error: string | null
  clearError(): void
  refresh(): Promise<void>

  getLoanNumber(loan: Loan): string

  addCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>
  updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<void>
  deleteCustomer(id: string): Promise<void>

  addLoan(data: Omit<Loan, 'id' | 'status' | 'createdAt' | 'loanNumber'>): Promise<Loan>
  updateLoan(id: string, data: Partial<Loan>): Promise<void>
  closeLoan(id: string): Promise<void>

  addEntry(data: Omit<LoanEntry, 'id' | 'createdAt'>): Promise<LoanEntry>
  updateEntry(id: string, data: Partial<LoanEntry>): Promise<void>
  deleteEntry(id: string): Promise<void>

  // Local computed helpers (no API needed)
  getCustomerById(id: string): Customer | undefined
  getLoanById(id: string): Loan | undefined
  getLoansByCustomer(customerId: string): Loan[]
  getEntriesForLoan(loanId: string): LoanEntry[]
}

const Ctx = createContext<FinanceCtx | null>(null)

// ─── provider ─────────────────────────────────────────────────────────────────

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [entries, setEntries] = useState<LoanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── initial data load ──────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [cs, ls, es] = await Promise.all([
        customerApi.list(),
        loanApi.list(),
        entryApi.list(),
      ])
      setCustomers(cs)
      setLoans(ls)
      setEntries(es)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to server'
      setError(msg)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // ── customers ─────────────────────────────────────────────────────────────

  async function addCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const created = await customerApi.create(data)
    setCustomers(prev => [...prev, created])
    return created
  }

  async function updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<void> {
    const updated = await customerApi.update(id, data)
    setCustomers(prev => prev.map(c => c.id === id ? updated : c))
  }

  async function deleteCustomer(id: string): Promise<void> {
    await customerApi.remove(id)
    setCustomers(prev => prev.filter(c => c.id !== id))
  }

  // ── loans ─────────────────────────────────────────────────────────────────

  function getLoanNumber(loan: Loan): string {
    const n = loan.loanNumber ?? ''
    // Format YYYYNNN → YYYY-NNN (e.g. 2026001 → 2026-001)
    if (n.length >= 5) return `${n.slice(0, 4)}-${n.slice(4)}`
    return n
  }

  async function addLoan(data: Omit<Loan, 'id' | 'status' | 'createdAt' | 'loanNumber'>): Promise<Loan> {
    const created = await loanApi.create(data)
    setLoans(prev => [...prev, created])
    return created
  }

  async function updateLoan(id: string, data: Partial<Loan>): Promise<void> {
    const updated = await loanApi.update(id, data)
    setLoans(prev => prev.map(l => l.id === id ? updated : l))
  }

  async function closeLoan(id: string): Promise<void> {
    const updated = await loanApi.close(id)
    setLoans(prev => prev.map(l => l.id === id ? updated : l))
  }

  // ── entries ───────────────────────────────────────────────────────────────

  async function addEntry(data: Omit<LoanEntry, 'id' | 'createdAt'>): Promise<LoanEntry> {
    const created = await entryApi.create(data)
    setEntries(prev => [...prev, created])
    return created
  }

  async function updateEntry(id: string, data: Partial<LoanEntry>): Promise<void> {
    const updated = await entryApi.update(id, {
      amount: data.amount,
      type: data.type,
      note: data.note,
    })
    setEntries(prev => prev.map(e => e.id === id ? updated : e))
  }

  async function deleteEntry(id: string): Promise<void> {
    await entryApi.remove(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  // ── local computed helpers ─────────────────────────────────────────────────

  const getCustomerById    = (id: string) => customers.find(c => c.id === id)
  const getLoanById        = (id: string) => loans.find(l => l.id === id)
  const getLoansByCustomer = (cid: string) => loans.filter(l => l.customerId === cid)
  const getEntriesForLoan  = (lid: string) => entries.filter(e => e.loanId === lid)

  return (
    <Ctx.Provider value={{
      customers, loans, entries, loading, initialized, error,
      clearError: () => setError(null),
      refresh,
      getLoanNumber,
      addCustomer, updateCustomer, deleteCustomer,
      addLoan, updateLoan, closeLoan,
      addEntry, updateEntry, deleteEntry,
      getCustomerById, getLoanById, getLoansByCustomer, getEntriesForLoan,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useFinance(): FinanceCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useFinance must be used inside <FinanceProvider>')
  return ctx
}
