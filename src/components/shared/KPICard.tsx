import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, className }: KPICardProps) {
  return (
    <div className={cn("glass-card p-5 animate-slide-up", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn(
            "text-xs font-semibold",
            trend === "up" && "text-success",
            trend === "down" && "text-destructive",
            trend === "neutral" && "text-muted-foreground"
          )}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
          </span>
          <span className="text-xs text-muted-foreground">vs last week</span>
        </div>
      )}
    </div>
  );
}
