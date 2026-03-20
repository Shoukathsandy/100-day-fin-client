import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { BrowserRouter } from "react-router-dom"
import { FinanceProvider } from "@/context/FinanceContext"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <FinanceProvider>
          <App />
        </FinanceProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
)
