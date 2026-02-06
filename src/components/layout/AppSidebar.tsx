import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Activity,
  Scale,
  ShieldAlert,
  UtensilsCrossed,
  Warehouse,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Executive Pulse", url: "/", icon: Activity },
  { title: "Financial Auditor", url: "/financial-auditor", icon: Scale },
  { title: "Audit Log", url: "/audit-log", icon: ShieldAlert },
  { title: "Menu & COGS", url: "/menu-cogs", icon: UtensilsCrossed },
  { title: "Inventory Vault", url: "/inventory", icon: Warehouse },
  { title: "Staff Intelligence", url: "/staff", icon: Users },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold tracking-tight text-foreground">
            RestoEMS
          </span>
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
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-primary"
              )}
              activeClassName=""
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center border-t border-border p-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
