import { Navigate, Route, Routes } from "react-router-dom"
import Page from "./components/Dashboard.tsx/page"
import Dashboard from "./pages/Dashboard"
import Customers from "./pages/Customers"
import Loans from "./pages/Loans"
import LoanDetail from "./pages/LoanDetail"
import CreateLoan from "./pages/CreateLoan"
import LoanHistory from "./pages/LoanHistory"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Page />}>
        <Route index element={<Dashboard />} />
        <Route path="customer" element={<Customers />} />
        <Route path="loans" element={<Loans />} />
        <Route path="loans/create" element={<CreateLoan />} />
        <Route path="loans/:id" element={<LoanDetail />} />
        <Route path="history" element={<LoanHistory />} />
      </Route>
    </Routes>
  )
}

export default App
