export interface Customer {
  id: string
  name: string
  phone: string
  address: string
  createdAt: string
}

export interface Loan {
  id: string
  customerId: string
  loanAmount: number
  dailyAmount: number
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD (startDate + totalDays - 1)
  totalDays: number   // default 100
  status: 'active' | 'closed'
  createdAt: string
}

export interface LoanEntry {
  id: string
  loanId: string
  date: string        // YYYY-MM-DD
  amount: number
  type: 'payment' | 'missed' | 'adjustment'
  note?: string
  createdAt: string
}
