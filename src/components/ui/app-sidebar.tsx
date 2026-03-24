import { useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  History,
  Plus,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const overviewNav = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, exact: true },
]

const managementNav = [
  { label: "Customers",    path: "/dashboard/customer", icon: Users,       exact: false },
  { label: "Active Loans", path: "/dashboard/loans",    icon: CreditCard,  exact: false },
  { label: "Loan History", path: "/dashboard/history",  icon: History,     exact: false },
]

interface AppSidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  isMobile: boolean
  onNavClick: () => void
  onToggle: () => void
}

export function AppSidebar({
  collapsed,
  mobileOpen,
  isMobile,
  onNavClick,
  onToggle,
}: AppSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  function isActive(path: string, exact: boolean) {
    if (exact) return location.pathname === path
    if (path === "/dashboard/loans") return location.pathname === "/dashboard/loans"
    return location.pathname.startsWith(path)
  }

  function handleNav(path: string) {
    navigate(path)
    onNavClick()
  }

  const wide = !collapsed || isMobile

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-50 flex flex-col",
        "bg-background/95 backdrop-blur-xl border-r border-border/50",
        "shadow-xl shadow-black/5",
        "transition-all duration-300 ease-in-out",
        wide ? "w-60" : "w-16",
        isMobile
          ? mobileOpen ? "translate-x-0" : "-translate-x-full"
          : "translate-x-0"
      )}
    >
      {/* Brand */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-border/40",
        !wide && "justify-center px-0"
      )}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25">
          <TrendingUp className="h-4 w-4" />
        </div>
        {wide && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight truncate">Finance Pro</p>
            <p className="text-[11px] text-muted-foreground truncate">100 Days Loans</p>
          </div>
        )}
        {isMobile && (
          <button
            onClick={onNavClick}
            className="ml-auto p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-5">
        <NavSection label="Overview" collapsed={!wide}>
          {overviewNav.map(({ label, path, icon: Icon, exact }) => (
            <NavItem
              key={path}
              label={label}
              icon={Icon}
              active={isActive(path, exact)}
              collapsed={!wide}
              onClick={() => handleNav(path)}
            />
          ))}
        </NavSection>

        <NavSection label="Management" collapsed={!wide}>
          {managementNav.map(({ label, path, icon: Icon, exact }) => (
            <NavItem
              key={path}
              label={label}
              icon={Icon}
              active={isActive(path, exact)}
              collapsed={!wide}
              onClick={() => handleNav(path)}
            />
          ))}
        </NavSection>

        <div className={cn("pt-1", !wide && "flex justify-center")}>
          <button
            onClick={() => handleNav("/dashboard/loans/create")}
            className={cn(
              "flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5",
              "bg-primary text-primary-foreground font-medium text-sm",
              "hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md shadow-primary/20",
              !wide && "w-10 h-10 justify-center px-0 py-0"
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {wide && <span>Create Loan</span>}
          </button>
        </div>
      </div>

      {/* User footer */}
      <div className={cn("border-t border-border/40 p-3", !wide && "flex justify-center")}>
        {wide ? (
          <div className="flex items-center gap-3 px-1 py-1.5 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer group">
            <Avatar className="h-8 w-8 rounded-xl shrink-0">
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xs font-bold">
                AD
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none truncate">Admin User</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">admin@finpro.in</p>
            </div>
            <LogOut className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        ) : (
          <Avatar className="h-8 w-8 rounded-xl cursor-pointer">
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xs font-bold">
              AD
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Collapse toggle desktop only */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className={cn(
            "absolute -right-3 top-[4.5rem]",
            "flex h-6 w-6 items-center justify-center rounded-full",
            "bg-background border border-border/60 shadow-md",
            "hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          )}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      )}
    </aside>
  )
}

function NavSection({ label, collapsed, children }: {
  label: string; collapsed: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {label}
        </p>
      )}
      {children}
    </div>
  )
}

function NavItem({ label, icon: Icon, active, collapsed, onClick }: {
  label: string; icon: React.ElementType; active: boolean; collapsed: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-sm font-medium",
        "transition-all duration-150 active:scale-[0.98]",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        collapsed && "justify-center px-0 w-10 h-10 mx-auto"
      )}
    >
      <Icon className={cn("shrink-0", active ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]")} />
      {!collapsed && <span className="truncate">{label}</span>}
      {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
    </button>
  )
}
