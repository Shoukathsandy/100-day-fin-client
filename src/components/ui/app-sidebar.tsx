import { useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  History,
  Plus,
  TrendingUp,
  LogOut,
  ChevronUp,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const overviewNav = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, exact: true },
]

const managementNav = [
  { label: "Customers", path: "/dashboard/customer", icon: Users, exact: false },
  { label: "Active Loans", path: "/dashboard/loans", icon: CreditCard, exact: false },
  { label: "Loan History", path: "/dashboard/history", icon: History, exact: false },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  function isActive(path: string, exact: boolean) {
    if (exact) return location.pathname === path
    // Active Loans should not match /loans/create or /loans/:id handled separately
    if (path === "/dashboard/loans") {
      return location.pathname === "/dashboard/loans"
    }
    return location.pathname.startsWith(path)
  }

  return (
    <Sidebar collapsible="icon">
      {/* ── Brand Header ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-pointer"
              onClick={() => navigate("/dashboard")}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="font-bold truncate text-base">Finance Pro</span>
                <span className="text-xs text-muted-foreground truncate">100 Days Loans</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* ── Overview ── */}
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {overviewNav.map(({ label, path, icon: Icon, exact }) => (
              <SidebarMenuItem key={path}>
                <SidebarMenuButton
                  tooltip={label}
                  isActive={isActive(path, exact)}
                  onClick={() => navigate(path)}
                  className="cursor-pointer"
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* ── Management ── */}
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarMenu>
            {managementNav.map(({ label, path, icon: Icon, exact }) => (
              <SidebarMenuItem key={path}>
                <SidebarMenuButton
                  tooltip={label}
                  isActive={isActive(path, exact)}
                  onClick={() => navigate(path)}
                  className="cursor-pointer"
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ── Create Loan CTA ── */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Create Loan"
                onClick={() => navigate("/dashboard/loans/create")}
                className="cursor-pointer text-primary font-semibold hover:text-primary hover:bg-primary/10"
              >
                <Plus />
                <span>Create Loan</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ── User Footer ── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Admin User</span>
                    <span className="truncate text-xs text-muted-foreground">admin@finpro.in</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56 rounded-lg"
              >
                <DropdownMenuItem disabled>
                  <span className="text-xs text-muted-foreground">Signed in as Admin</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
