import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Scale,
  ShieldAlert,
  UtensilsCrossed,
  Warehouse,
  Users,
  Settings,
  BarChart3,
  Database,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Executive Pulse", url: "/", icon: Activity },
  { title: "Financial Auditor", url: "/financial-auditor", icon: Scale },
  { title: "Audit Log", url: "/audit-log", icon: ShieldAlert },
  { title: "Menu & COGS", url: "/menu-cogs", icon: UtensilsCrossed },
  { title: "Inventory Vault", url: "/inventory", icon: Warehouse },
  { title: "Staff Intelligence", url: "/staff", icon: Users },
  { title: "Profit & Loss", url: "/profit-loss", icon: BarChart3 },
  { title: "Data Tools", url: "/data-tools", icon: Database },
  { title: "Admin Settings", url: "/settings", icon: Settings },
];

export { navItems };

interface AppSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const handleNavClick = () => {
    // Auto-close drawer on mobile when a menu item is selected
    onMobileClose?.();
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
        </div>
        {(!collapsed || mobileOpen) && (
          <span className="text-sm font-bold tracking-tight text-foreground">
            Backstreet Bassac Lane
          </span>
        )}
        {/* Close button for mobile drawer */}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const active = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-primary"
              )}
              activeClassName=""
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {(!collapsed || mobileOpen) && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      {!mobileOpen && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center border-t border-border p-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar shadow-2xl animate-slide-in-left md:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
