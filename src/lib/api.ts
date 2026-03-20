import type { Customer, Loan, LoanEntry } from '@/types/finance'

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000').replace(/\/$/, '')

// ─── core fetch wrapper ───────────────────────────────────────────────────────

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.detail ?? json.message ?? `HTTP ${res.status}`)
  }
  return json.data as T
}

// ─── customers ───────────────────────────────────────────────────────────────

export const customerApi = {
  list: () =>
    req<Customer[]>('GET', '/api/customers'),

  create: (data: Omit<Customer, 'id' | 'createdAt'>) =>
    req<Customer>('POST', '/api/customers', data),

  update: (id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>) =>
    req<Customer>('PUT', `/api/customers/${id}`, data),

  remove: (id: string) =>
    req<{ id: string }>('DELETE', `/api/customers/${id}`),
}

// ─── loans ───────────────────────────────────────────────────────────────────

export const loanApi = {
  list: (params?: { customerId?: string; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.customerId) q.set('customerId', params.customerId)
    if (params?.status)     q.set('status', params.status)
    const qs = q.toString()
    return req<Loan[]>('GET', `/api/loans${qs ? '?' + qs : ''}`)
  },

  create: (data: Omit<Loan, 'id' | 'status' | 'createdAt'>) =>
    req<Loan>('POST', '/api/loans', data),

  update: (id: string, data: Partial<Loan>) =>
    req<Loan>('PUT', `/api/loans/${id}`, data),

  close: (id: string) =>
    req<Loan>('PATCH', `/api/loans/${id}/close`),

  extend: (id: string, days: number) =>
    req<Loan>('PATCH', `/api/loans/${id}/extend?days=${days}`),

  entries: (loanId: string) =>
    req<LoanEntry[]>('GET', `/api/loans/${loanId}/entries`),
}

// ─── entries ─────────────────────────────────────────────────────────────────

export const entryApi = {
  list: (loanId?: string) =>
    req<LoanEntry[]>('GET', `/api/entries${loanId ? '?loanId=' + loanId : ''}`),

  create: (data: Omit<LoanEntry, 'id' | 'createdAt'>) =>
    req<LoanEntry>('POST', '/api/entries', data),

  update: (id: string, data: Partial<Pick<LoanEntry, 'amount' | 'type' | 'note'>>) =>
    req<LoanEntry>('PUT', `/api/entries/${id}`, data),

  remove: (id: string) =>
    req<{ id: string }>('DELETE', `/api/entries/${id}`),
}

// ─── dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalDisbursed: number
  totalCollected: number
  totalPending: number
  customerCount: number
  loanCount: number
  activeLoanCount: number
  overdueLoanCount: number
  todayTotal: number
  dueTodayLoans: (Loan & { customerName: string; customerPhone: string })[]
}

export interface DailyPoint {
  date: string   // MM-DD
  amount: number
}

export const dashboardApi = {
  stats: () =>
    req<DashboardStats>('GET', '/api/dashboard/stats'),

  daily: (from?: string, to?: string) => {
    const q = new URLSearchParams()
    if (from) q.set('from', from)
    if (to)   q.set('to', to)
    return req<DailyPoint[]>('GET', `/api/dashboard/daily?${q.toString()}`)
  },
}
