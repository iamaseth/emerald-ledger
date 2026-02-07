import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Activity, Scale, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const bottomNavItems = [
  { title: "Dashboard", url: "/", icon: Activity },
  { title: "Reconciler", url: "/financial-auditor", icon: Scale },
  { title: "Alerts", url: "/audit-log", icon: ShieldAlert },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-border bg-sidebar md:hidden">
      {bottomNavItems.map((item) => {
        const active = location.pathname === item.url;
        return (
          <NavLink
            key={item.url}
            to={item.url}
            end
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
            activeClassName=""
          >
            <item.icon className={cn("h-5 w-5", active && "text-primary")} />
            <span>{item.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
