import { KPICard } from "@/components/shared/KPICard";
import { ExportButton } from "@/components/shared/ExportButton";
import { getKPIs } from "@/lib/data-service";
import { mockDailySales } from "@/lib/mock-data";
import { DollarSign, TrendingUp, Receipt, Percent, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

export default function ExecutivePulse() {
  const kpi = getKPIs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Executive Pulse</h1>
          <p className="text-sm text-muted-foreground">Daily performance overview — Feb 6, 2025</p>
        </div>
        <ExportButton label="Export PDF" />
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard title="Gross Sales" value={fmt(kpi.grossSales)} icon={DollarSign} trend="up" trendValue="12.4%" />
        <KPICard title="Net Sales" value={fmt(kpi.netSales)} icon={TrendingUp} trend="up" trendValue="11.8%" />
        <KPICard title="VAT (10%)" value={fmt(kpi.vat)} icon={Receipt} />
        <KPICard title="Service Charge (5%)" value={fmt(kpi.serviceCharge)} icon={Receipt} />
        <KPICard title="Labor Cost %" value={`${kpi.laborCostPct.toFixed(1)}%`} icon={Users} trend="down" trendValue="2.1%" subtitle="Target: < 30%" />
      </div>

      {/* Sales vs Deposits Chart */}
      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Daily Sales vs Bank Deposits</h2>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={mockDailySales} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 16%)" />
            <XAxis dataKey="date" tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
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
            <Bar dataKey="sales" name="Daily Sales" fill="hsl(152 60% 48%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="deposits" name="Bank Deposits" fill="hsl(210 80% 55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
