import { useState } from "react";
import { format } from "date-fns";
import { KPICard } from "@/components/shared/KPICard";
import { ExportButton } from "@/components/shared/ExportButton";
import { usePeriodData, type PeriodMode } from "@/hooks/usePeriodData";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DollarSign,
  TrendingUp,
  Landmark,
  ShieldCheck,
  AlertTriangle,
  CalendarIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

const MODES: { value: PeriodMode; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

function KPISkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}

export default function ExecutivePulse() {
  const { mode, changeMode, stats, isPending, changeCustomRange } = usePeriodData();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      changeCustomRange(range.from, range.to);
      setCalendarOpen(false);
    }
  };

  const periodLabel =
    mode === "daily"
      ? "Today"
      : mode === "weekly"
        ? "Last 7 days"
        : mode === "monthly"
          ? "Last 30 days"
          : dateRange?.from && dateRange?.to
            ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`
            : "Select range";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Executive Pulse</h1>
          <p className="text-sm text-muted-foreground">Performance overview — {periodLabel}</p>
        </div>
        <ExportButton label="Export PDF" />
      </div>

      {/* Period Toggle + Date Picker */}
      <div className="flex flex-wrap items-center gap-2">
        {MODES.map((m) => (
          <Button
            key={m.value}
            size="sm"
            variant={mode === m.value ? "default" : "outline"}
            onClick={() => {
              if (m.value === "custom") {
                setCalendarOpen(true);
              } else {
                changeMode(m.value);
              }
            }}
            className="text-xs"
          >
            {m.label}
          </Button>
        ))}

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "text-xs gap-1.5",
                mode === "custom" && "border-primary text-primary"
              )}
              onClick={() => setCalendarOpen(true)}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`
                : "Pick dates"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateSelect}
              numberOfMonths={1}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI Cards */}
      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KPISkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Sales"
            value={fmt(stats.totalSales)}
            icon={DollarSign}
            trend="up"
            trendValue={`${stats.filteredSales.length} day${stats.filteredSales.length !== 1 ? "s" : ""}`}
          />
          <KPICard
            title="Verified Deposits"
            value={fmt(stats.totalDeposits)}
            icon={Landmark}
            trend={stats.totalDeposits >= stats.totalSales ? "up" : "down"}
            trendValue={`${((stats.totalDeposits / Math.max(stats.totalSales, 1)) * 100).toFixed(1)}% of sales`}
          />
          <KPICard
            title="Reconciliation Health"
            value={`${stats.reconciliationPct.toFixed(0)}%`}
            icon={ShieldCheck}
            trend={stats.reconciliationPct >= 80 ? "up" : "down"}
            trendValue={`${stats.matchedCount}/${stats.totalBills} matched`}
            subtitle="Bills matched"
          />
          <KPICard
            title="Period Discrepancy"
            value={fmt(stats.discrepancy)}
            icon={AlertTriangle}
            trend={stats.discrepancy > 0 ? "down" : "up"}
            trendValue={stats.discrepancy > 0 ? "Unverified gap" : "Fully verified"}
            className={stats.discrepancy > 0 ? "border-warning/30" : ""}
          />
        </div>
      )}

      {/* Trend Line Chart */}
      {isPending ? (
        <ChartSkeleton />
      ) : (
        <div className="glass-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Sales vs Verified Deposits — {periodLabel}
          </h2>
          {stats.filteredSales.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No data for this period.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.filteredSales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 16%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(222 40% 10%)",
                    border: "1px solid hsl(215 20% 16%)",
                    borderRadius: "8px",
                    color: "hsl(210 20% 92%)",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "hsl(215 15% 55%)" }} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke="hsl(152 60% 48%)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(152 60% 48%)" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="deposits"
                  name="Verified Deposits"
                  stroke="hsl(210 80% 55%)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(210 80% 55%)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Discrepancy Detail Card */}
      {!isPending && stats.discrepancy > 0 && (
        <div className="glass-card border-warning/30 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-warning/10 p-2.5">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Period Discrepancy Alert
              </h3>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-warning">{fmt(stats.discrepancy)}</span>{" "}
                in sales were not matched by bank deposits during this {mode === "daily" ? "day" : mode === "custom" ? "period" : mode === "weekly" ? "week" : "month"}.
                This may include pending cash deposits or unreconciled QR payments.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
