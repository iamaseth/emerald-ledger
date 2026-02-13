import { useIncomeStatement } from "@/hooks/useIncomeStatement";
import { KPICard } from "@/components/shared/KPICard";
import { ExportButton } from "@/components/shared/ExportButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

const fmtSigned = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

// ─── CIFRS for SMEs Grouping ──────────────────────────────
type CIFRSGroup = "COGS" | "Kitchen & Food" | "Payroll" | "Fixed & Admin" | "Operations" | "Marketing";

const cifrsMapping: Record<string, CIFRSGroup> = {
  "Cost of Beer and liquer": "COGS",
  "Cigareet expense": "COGS",
  "Kitchen expense - BSB": "Kitchen & Food",
  "Kitchen Expense - Burger Bun": "Kitchen & Food",
  "Kitchen expense - LSH": "Kitchen & Food",
  "Kitchen Expense - Pepperoni": "Kitchen & Food",
  "Kitchen expense - Salmon": "Kitchen & Food",
  "Kitchen - Cheese": "Kitchen & Food",
  "Kitchen - Other": "Kitchen & Food",
  "Kitchen- Miscellaneous expense": "Kitchen & Food",
  "Grocery expense": "Kitchen & Food",
  "Fruit expense": "Kitchen & Food",
  "Ice expense": "Kitchen & Food",
  "Gas expense": "Kitchen & Food",
  "Payroll Expense": "Payroll",
  "Payroll-Overtime": "Payroll",
  "Casual worker": "Payroll",
  "Rental Expense": "Fixed & Admin",
  "Electricity expense": "Fixed & Admin",
  "Water expense": "Fixed & Admin",
  "Internet Expense": "Fixed & Admin",
  "POS service": "Fixed & Admin",
  "Interest expense": "Fixed & Admin",
  "Monthly Tax expense": "Fixed & Admin",
  "Officer expense": "Fixed & Admin",
  "Office Supply expense": "Fixed & Admin",
  "Miscellaneous expenses": "Fixed & Admin",
  "Other expense": "Fixed & Admin",
  "Expense with no invoice": "Fixed & Admin",
  "Drinking water for staffs": "Fixed & Admin",
  "Transportation expense": "Fixed & Admin",
  "Facilities expense": "Operations",
  "Maintenance expense": "Operations",
  "Cleaning expense": "Operations",
  "Decoration expense": "Operations",
  "Flower expense": "Operations",
  "Music system rental expense": "Operations",
  "Marketing expense": "Marketing",
  "Entertainment expense": "Marketing",
  "Event expenses": "Marketing",
};

const cifrsOrder: CIFRSGroup[] = ["COGS", "Kitchen & Food", "Payroll", "Fixed & Admin", "Operations", "Marketing"];

const cifrsColors: Record<CIFRSGroup, string> = {
  "COGS": "bg-destructive/15 text-destructive border-destructive/30",
  "Kitchen & Food": "bg-warning/15 text-warning border-warning/30",
  "Payroll": "bg-info/15 text-info border-info/30",
  "Fixed & Admin": "bg-primary/15 text-primary border-primary/30",
  "Operations": "bg-secondary text-muted-foreground border-border",
  "Marketing": "bg-accent/15 text-accent-foreground border-accent",
};

const DONUT_COLORS = [
  "hsl(0, 72%, 51%)",     // COGS - destructive
  "hsl(38, 92%, 50%)",    // Kitchen - warning
  "hsl(210, 80%, 55%)",   // Payroll - info
  "hsl(152, 60%, 48%)",   // Fixed & Admin - primary
  "hsl(215, 25%, 40%)",   // Operations
  "hsl(280, 60%, 55%)",   // Marketing
];

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

  // Group expenses by CIFRS categories
  const grouped = new Map<CIFRSGroup, { items: typeof data.expenses; total: number }>();
  cifrsOrder.forEach((g) => grouped.set(g, { items: [], total: 0 }));

  data.expenses.forEach((e) => {
    const group = cifrsMapping[e.category] || "Fixed & Admin";
    const g = grouped.get(group)!;
    g.items.push(e);
    g.total += e.amount;
  });

  // Compute COGS total for Gross Profit line
  const cogsTotal = grouped.get("COGS")?.total ?? 0;
  const kitchenTotal = grouped.get("Kitchen & Food")?.total ?? 0;
  const totalDirectCosts = cogsTotal + kitchenTotal;
  const grossAfterDirect = data.revenue - totalDirectCosts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Profit & Loss</h1>
          <p className="text-sm text-muted-foreground">
            CIFRS for SMEs — {data.period || "All Periods"}
          </p>
        </div>
        <ExportButton label="Export PDF" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Revenue" value={fmt(data.revenue)} icon={DollarSign} trend="up" trendValue="Operating income" />
        <KPICard title="Total Expenses" value={fmt(data.totalExpense)} icon={TrendingDown} trendValue={`${((data.totalExpense / data.revenue) * 100).toFixed(0)}% of revenue`} />
        <KPICard title="Gross Profit" value={fmtSigned(data.grossProfit)} icon={TrendingUp} trend={data.grossProfit > 0 ? "up" : "down"} trendValue={`${profitMargin}% margin`} />
        <KPICard title="Retained Profit" value={fmtSigned(retainedProfit)} icon={BarChart3} trend={retainedProfit > 0 ? "up" : "down"} trendValue={`After ${fmt(totalProfitShare)} distributions`} />
      </div>

      {/* CIFRS Expense Breakdown with Donut Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donut Chart */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Expense Category Breakdown</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={cifrsOrder.map((group, i) => ({ name: group, value: grouped.get(group)?.total ?? 0 })).filter((d) => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {cifrsOrder.map((group, i) => {
                  const total = grouped.get(group)?.total ?? 0;
                  return total > 0 ? <Cell key={group} fill={DONUT_COLORS[i]} /> : null;
                }).filter(Boolean)}
              </Pie>
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
              <Legend
                wrapperStyle={{ fontSize: 11, color: "hsl(215 15% 55%)" }}
                formatter={(value: string) => {
                  const total = grouped.get(value as CIFRSGroup)?.total ?? 0;
                  const pct = ((total / data.totalExpense) * 100).toFixed(0);
                  return `${value} (${pct}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar breakdown */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">CIFRS Expense Breakdown</h2>
          <div className="space-y-3">
            {cifrsOrder.map((group) => {
              const { total } = grouped.get(group)!;
              if (total === 0) return null;
              const pct = (total / data.totalExpense) * 100;
              return (
                <div key={group} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="outline" className={cn("text-[10px]", cifrsColors[group])}>
                      {group}
                    </Badge>
                    <span className="font-mono text-foreground">
                      {fmt(total)} <span className="text-muted-foreground">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CIFRS Income Statement Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground text-xs">Line Item</TableHead>
                <TableHead className="text-muted-foreground text-xs">Classification</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Amount</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">% of Revenue</TableHead>
                <TableHead className="text-muted-foreground text-xs">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Operating Income */}
              <TableRow className="border-border bg-primary/5">
                <TableCell className="text-sm font-bold text-primary">Operating Income (Revenue)</TableCell>
                <TableCell />
                <TableCell className="text-sm text-right font-bold text-primary">{fmt(data.revenue)}</TableCell>
                <TableCell className="text-xs text-right text-muted-foreground">100%</TableCell>
                <TableCell />
              </TableRow>

              {/* CIFRS groups */}
              {cifrsOrder.map((group) => {
                const { items, total } = grouped.get(group)!;
                const activeItems = items.filter((e) => e.amount > 0).sort((a, b) => b.amount - a.amount);
                if (activeItems.length === 0) return null;

                return (
                  <>
                    {/* Group subtotal header */}
                    <TableRow key={`${group}-header`} className="border-border bg-muted/30">
                      <TableCell className="text-xs font-bold text-foreground">{group}</TableCell>
                      <TableCell />
                      <TableCell className="text-xs text-right font-bold text-destructive">-{fmt(total)}</TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">{((total / data.revenue) * 100).toFixed(1)}%</TableCell>
                      <TableCell />
                    </TableRow>
                    {/* Individual items */}
                    {activeItems.map((e) => (
                      <TableRow key={e.category} className="border-border hover:bg-secondary/40">
                        <TableCell className="text-xs text-foreground pl-6">{e.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", cifrsColors[group])}>
                            {group}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono text-destructive">-{fmt(e.amount)}</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">{((e.amount / data.revenue) * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{e.note}</TableCell>
                      </TableRow>
                    ))}
                    {/* Subtotal after COGS+Kitchen = Gross Profit */}
                    {group === "Kitchen & Food" && (
                      <TableRow className="border-border bg-success/5 border-t-2">
                        <TableCell className="text-sm font-bold text-success">Gross Profit (after COGS + Kitchen)</TableCell>
                        <TableCell />
                        <TableCell className="text-sm text-right font-bold text-success">{fmtSigned(grossAfterDirect)}</TableCell>
                        <TableCell className="text-xs text-right font-semibold text-muted-foreground">{((grossAfterDirect / data.revenue) * 100).toFixed(1)}%</TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </>
                );
              })}

              {/* Total Expense */}
              <TableRow className="border-border bg-destructive/5 border-t-2">
                <TableCell className="text-sm font-bold text-destructive">Total Expenses</TableCell>
                <TableCell />
                <TableCell className="text-sm text-right font-bold text-destructive">-{fmt(data.totalExpense)}</TableCell>
                <TableCell className="text-xs text-right font-semibold text-muted-foreground">{((data.totalExpense / data.revenue) * 100).toFixed(0)}%</TableCell>
                <TableCell />
              </TableRow>

              {/* Net Profit */}
              <TableRow className="border-border bg-primary/5">
                <TableCell className="text-sm font-bold text-foreground">Net Profit / (Loss)</TableCell>
                <TableCell />
                <TableCell className={cn("text-sm text-right font-bold", data.grossProfit >= 0 ? "text-success" : "text-destructive")}>
                  {fmtSigned(data.grossProfit)}
                </TableCell>
                <TableCell className="text-xs text-right font-semibold text-muted-foreground">{profitMargin}%</TableCell>
                <TableCell />
              </TableRow>

              {/* Profit shares */}
              {data.profitShares.map((ps) => (
                <TableRow key={ps.name} className="border-border hover:bg-secondary/40">
                  <TableCell className="text-xs text-foreground pl-6">Distribution — {ps.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] bg-info/15 text-info border-info/30">Distribution</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono text-info">{fmt(ps.amount)}</TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              ))}

              {/* Retained */}
              <TableRow className="border-border bg-primary/10 border-t-2">
                <TableCell className="text-sm font-bold text-foreground">Retained Earnings</TableCell>
                <TableCell />
                <TableCell className={cn("text-sm text-right font-bold", retainedProfit >= 0 ? "text-success" : "text-destructive")}>
                  {fmtSigned(retainedProfit)}
                </TableCell>
                <TableCell className="text-xs text-right font-semibold text-muted-foreground">{((retainedProfit / data.revenue) * 100).toFixed(1)}%</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
