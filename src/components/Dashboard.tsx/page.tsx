import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { useFinance } from "@/context/FinanceContext"
import { useIsMobile } from "@/hooks/use-mobile"
import { WifiOff, RefreshCw, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

const breadcrumbMap: Record<string, string> = {
  "/dashboard":              "Dashboard",
  "/dashboard/customer":     "Customers",
  "/dashboard/loans":        "Active Loans",
  "/dashboard/loans/create": "Create Loan",
  "/dashboard/history":      "Loan History",
}

function getBreadcrumb(pathname: string): string {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname]
  if (pathname.startsWith("/dashboard/loans/")) return "Loan Detail"
  return "Dashboard"
}

export default function Page() {
  const location = useLocation()
  const isMobile = useIsMobile()
  const { error, refresh } = useFinance()

  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const pageTitle    = getBreadcrumb(location.pathname)
  const sidebarWidth = isMobile ? 0 : (collapsed ? 64 : 240)

  return (
    <div className="min-h-screen bg-muted/30">

      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        isMobile={isMobile}
        onNavClick={() => setMobileOpen(false)}
        onToggle={() => setCollapsed(c => !c)}
      />

      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/50 bg-background/80 backdrop-blur-md px-4 shadow-sm">
          {isMobile && (
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
          <span className="text-sm font-semibold text-foreground truncate">{pageTitle}</span>
        </header>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 bg-destructive/10 border-b border-destructive/15 px-4 py-2.5 text-sm text-destructive">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error} — make sure the backend is running on port 8000.</span>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={refresh}>
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
