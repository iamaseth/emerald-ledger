import { useIncomeStatement } from "@/hooks/useIncomeStatement";
import { KPICard } from "@/components/shared/KPICard";
import { ExportButton } from "@/components/shared/ExportButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

const fmtSigned = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

// Group expense categories for visual hierarchy
const categoryGroups: Record<string, string> = {
  "Cost of Beer and liquer": "Cost of Goods",
  "Cigareet expense": "Cost of Goods",
  "Kitchen expense - BSB": "Kitchen",
  "Kitchen Expense - Burger Bun": "Kitchen",
  "Kitchen expense - LSH": "Kitchen",
  "Kitchen Expense - Pepperoni": "Kitchen",
  "Kitchen expense - Salmon": "Kitchen",
  "Kitchen - Cheese": "Kitchen",
  "Kitchen - Other": "Kitchen",
  "Kitchen- Miscellaneous expense": "Kitchen",
  "Grocery expense": "Kitchen",
  "Fruit expense": "Kitchen",
  "Ice expense": "Kitchen",
  "Gas expense": "Kitchen",
  "Payroll Expense": "Payroll",
  "Payroll-Overtime": "Payroll",
  "Casual worker": "Payroll",
  "Rental Expense": "Fixed Costs",
  "Electricity expense": "Fixed Costs",
  "Water expense": "Fixed Costs",
  "Internet Expense": "Fixed Costs",
  "POS service": "Fixed Costs",
  "Interest expense": "Fixed Costs",
  "Monthly Tax expense": "Fixed Costs",
  "Facilities expense": "Operations",
  "Maintenance expense": "Operations",
  "Cleaning expense": "Operations",
  "Decoration expense": "Operations",
  "Flower expense": "Operations",
  "Music system rental expense": "Operations",
  "Marketing expense": "Marketing",
  "Entertainment expense": "Marketing",
  "Event expenses": "Marketing",
  "Officer expense": "Admin",
  "Office Supply expense": "Admin",
  "Miscellaneous expenses": "Admin",
  "Other expense": "Admin",
  "Expense with no invoice": "Admin",
  "Drinking water for staffs": "Admin",
  "Transportation expense": "Admin",
};

const groupColors: Record<string, string> = {
  "Cost of Goods": "bg-destructive/15 text-destructive border-destructive/30",
  Kitchen: "bg-warning/15 text-warning border-warning/30",
  Payroll: "bg-info/15 text-info border-info/30",
  "Fixed Costs": "bg-primary/15 text-primary border-primary/30",
  Operations: "bg-secondary text-muted-foreground border-border",
  Marketing: "bg-accent/15 text-accent border-accent/30",
  Admin: "bg-muted text-muted-foreground border-border",
};

export default function ProfitLoss() {
  const { data, loading, error } = useIncomeStatement();

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const profitMargin = ((data.grossProfit / data.revenue) * 100).toFixed(1);
  const totalProfitShare = data.profitShares.reduce((s, p) => s + p.amount, 0);
  const retainedProfit = data.grossProfit - totalProfitShare;

  // Group expenses
  const grouped = new Map<string, { items: typeof data.expenses; total: number }>();
  data.expenses.forEach((e) => {
    const group = categoryGroups[e.category] || "Other";
    if (!grouped.has(group)) grouped.set(group, { items: [], total: 0 });
    const g = grouped.get(group)!;
    g.items.push(e);
    g.total += e.amount;
  });

  // Sort groups by total descending
  const sortedGroups = [...grouped.entries()].sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Profit & Loss</h1>
          <p className="text-sm text-muted-foreground">
            Income Statement — {data.period || "December 2025"}
          </p>
        </div>
        <ExportButton label="Export PDF" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Revenue"
          value={fmt(data.revenue)}
          icon={DollarSign}
          trend="up"
          trendValue="Gross sales"
        />
        <KPICard
          title="Total Expenses"
          value={fmt(data.totalExpense)}
          icon={TrendingDown}
          trendValue={`${((data.totalExpense / data.revenue) * 100).toFixed(0)}% of revenue`}
        />
        <KPICard
          title="Gross Profit"
          value={fmtSigned(data.grossProfit)}
          icon={TrendingUp}
          trend={data.grossProfit > 0 ? "up" : "down"}
          trendValue={`${profitMargin}% margin`}
        />
        <KPICard
          title="Retained Profit"
          value={fmtSigned(retainedProfit)}
          icon={BarChart3}
          trend={retainedProfit > 0 ? "up" : "down"}
          trendValue={`After ${fmt(totalProfitShare)} profit shares`}
        />
      </div>

      {/* Expense Breakdown by Group */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Expense Breakdown</h2>

        {/* Visual bar chart */}
        <div className="space-y-3">
          {sortedGroups.map(([group, { total }]) => {
            const pct = (total / data.totalExpense) * 100;
            const colorClass = groupColors[group] || groupColors.Admin;
            return (
              <div key={group} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-[10px]", colorClass)}>
                      {group}
                    </Badge>
                  </div>
                  <span className="font-mono text-foreground">
                    {fmt(total)} <span className="text-muted-foreground">({pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground text-xs">Category</TableHead>
                <TableHead className="text-muted-foreground text-xs">Group</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Amount</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">% of Revenue</TableHead>
                <TableHead className="text-muted-foreground text-xs">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Revenue row */}
              <TableRow className="border-border bg-primary/5">
                <TableCell className="text-sm font-bold text-primary">Revenue</TableCell>
                <TableCell />
                <TableCell className="text-sm text-right font-bold text-primary">{fmt(data.revenue)}</TableCell>
                <TableCell className="text-xs text-right text-muted-foreground">100%</TableCell>
                <TableCell />
              </TableRow>

              {/* Expense rows */}
              {data.expenses
                .filter((e) => e.amount > 0)
                .sort((a, b) => b.amount - a.amount)
                .map((e) => {
                  const group = categoryGroups[e.category] || "Other";
                  const colorClass = groupColors[group] || groupColors.Admin;
                  const pct = ((e.amount / data.revenue) * 100).toFixed(1);
                  return (
                    <TableRow key={e.category} className="border-border hover:bg-secondary/40">
                      <TableCell className="text-xs text-foreground">{e.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", colorClass)}>
                          {group}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono text-destructive">
                        -{fmt(e.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">{pct}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {e.note}
                      </TableCell>
                    </TableRow>
                  );
                })}

              {/* Total Expense row */}
              <TableRow className="border-border bg-destructive/5 border-t-2">
                <TableCell className="text-sm font-bold text-destructive">Total Expenses</TableCell>
                <TableCell />
                <TableCell className="text-sm text-right font-bold text-destructive">
                  -{fmt(data.totalExpense)}
                </TableCell>
                <TableCell className="text-xs text-right font-semibold text-muted-foreground">
                  {((data.totalExpense / data.revenue) * 100).toFixed(0)}%
                </TableCell>
                <TableCell />
              </TableRow>

              {/* Gross Profit row */}
              <TableRow className="border-border bg-primary/5">
                <TableCell className="text-sm font-bold text-foreground">Gross Profit</TableCell>
                <TableCell />
                <TableCell className={cn("text-sm text-right font-bold", data.grossProfit >= 0 ? "text-success" : "text-destructive")}>
                  {fmtSigned(data.grossProfit)}
                </TableCell>
                <TableCell className="text-xs text-right font-semibold text-muted-foreground">
                  {profitMargin}%
                </TableCell>
                <TableCell />
              </TableRow>

              {/* Profit shares */}
              {data.profitShares.map((ps) => (
                <TableRow key={ps.name} className="border-border hover:bg-secondary/40">
                  <TableCell className="text-xs text-foreground">Profit Share — {ps.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] bg-info/15 text-info border-info/30">
                      Distribution
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono text-info">
                    {fmt(ps.amount)}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
