import { useState } from "react";
import { useRealData } from "@/contexts/RealDataContext";
import { KPICard } from "@/components/shared/KPICard";
import { ExportButton } from "@/components/shared/ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DollarSign, Landmark, ShieldCheck, ArrowUpRight, ArrowDownRight, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtUSD } from "@/lib/tax";

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function FinancialAuditor() {
  const { sales, bank, loading } = useRealData();
  const [showExpensesOnly, setShowExpensesOnly] = useState(false);

  // Derive KPIs from real data
  const totalSalesRevenue = sales.reduce((s, r) => s + r.total_sales, 0);
  const totalNetRevenue = sales.reduce((s, r) => s + r.net_revenue, 0);
  const totalBankIn = bank.reduce((s, r) => s + r.money_in, 0);
  const totalBankOut = bank.reduce((s, r) => s + r.money_out, 0);
  const netBankFlow = totalBankIn - totalBankOut;

  const filteredBank = showExpensesOnly
    ? bank.filter((r) => r.money_out > 0)
    : bank;

  const expenseCount = bank.filter((r) => r.money_out > 0).length;
  const depositCount = bank.filter((r) => r.money_in > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Financial Auditor</h1>
          <p className="text-sm text-muted-foreground">December 2025 — POS Sales vs Bank Activity</p>
        </div>
        <ExportButton label="Export Excel" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <KPICard
          title="Total POS Sales"
          value={fmt(totalSalesRevenue)}
          icon={DollarSign}
          trendValue={`${sales.length} items`}
        />
        <KPICard
          title="Net Revenue"
          value={fmt(totalNetRevenue)}
          icon={DollarSign}
          trend="up"
          trendValue={`After discounts`}
        />
        <KPICard
          title="Bank Deposits"
          value={fmt(totalBankIn)}
          icon={Landmark}
          trend="up"
          trendValue={`${depositCount} deposits`}
        />
        <KPICard
          title="Bank Expenses"
          value={fmt(totalBankOut)}
          icon={ShieldCheck}
          trend="down"
          trendValue={`${expenseCount} transactions`}
        />
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="h-3.5 w-3.5 text-success" />
            <span>Deposits: {depositCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
            <span>Expenses: {expenseCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
            <span>Net: {fmt(netBankFlow)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="expense-toggle"
            checked={showExpensesOnly}
            onCheckedChange={setShowExpensesOnly}
          />
          <Label htmlFor="expense-toggle" className="text-xs text-muted-foreground cursor-pointer">
            Expenses Only ({expenseCount})
          </Label>
        </div>
      </div>

      {/* Bank Transactions Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                <TableHead className="text-muted-foreground text-xs">Transaction Details</TableHead>
                <TableHead className="text-muted-foreground text-xs">Remark</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Money In</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Money Out</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Balance</TableHead>
                <TableHead className="text-muted-foreground text-xs text-center">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBank.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBank.map((txn, i) => {
                  const isDeposit = txn.money_in > 0;
                  return (
                    <TableRow key={i} className="border-border hover:bg-secondary/40">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{txn.date}</TableCell>
                      <TableCell className="text-xs text-foreground max-w-[300px] truncate" title={txn.transaction_details}>
                        {txn.transaction_details.slice(0, 80)}…
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={txn.remark}>
                        {txn.remark || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium">
                        {txn.money_in > 0 ? (
                          <span className="text-success">{fmt(txn.money_in)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium">
                        {txn.money_out > 0 ? (
                          <span className="text-destructive">{fmt(txn.money_out)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono text-foreground">
                        {fmt(txn.balance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium",
                            isDeposit
                              ? "bg-success/15 text-success border-success/30"
                              : "bg-destructive/15 text-destructive border-destructive/30"
                          )}
                        >
                          {isDeposit ? "Deposit" : "Expense"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
