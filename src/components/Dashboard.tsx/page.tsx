import { AppSidebar } from "@/components/ui/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Outlet, useLocation } from "react-router-dom"
import { useFinance } from "@/context/FinanceContext"
import { Loader2, WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

const breadcrumbMap: Record<string, string> = {
  "/dashboard":               "Dashboard",
  "/dashboard/customer":      "Customers",
  "/dashboard/loans":         "Active Loans",
  "/dashboard/loans/create":  "Create Loan",
  "/dashboard/history":       "Loan History",
}

function getBreadcrumb(pathname: string): string {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname]
  if (pathname.startsWith("/dashboard/loans/")) return "Loan Detail"
  return "Dashboard"
}

export default function Page() {
  const location = useLocation()
  const { loading, error, refresh } = useFinance()
  const pageTitle = getBreadcrumb(location.pathname)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">

        <AppSidebar />

        <SidebarInset className="flex flex-col flex-1">

          {/* Header */}
          <header className="flex h-12 items-center border-b bg-background sticky px-3 top-0 z-10 gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium text-muted-foreground">{pageTitle}</span>

            {/* Inline loading indicator */}
            {loading && (
              <span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading…
              </span>
            )}
          </header>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 bg-destructive/10 border-b border-destructive/20 px-4 py-2.5 text-sm text-destructive">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span className="flex-1">{error} — make sure the backend is running on port 8000.</span>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={refresh}>
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          )}

          {/* Content */}
          <main className="flex-1 overflow-y-auto bg-background p-3 lg:p-6">
            {loading && !error ? (
              <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Connecting to server…</p>
              </div>
            ) : (
              <Outlet />
            )}
          </main>

        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
