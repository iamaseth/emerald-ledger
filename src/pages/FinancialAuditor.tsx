import { useState, useMemo } from "react";
import { useRealData } from "@/contexts/RealDataContext";
import { KPICard } from "@/components/shared/KPICard";
import { ExportButton } from "@/components/shared/ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Landmark, ShieldCheck, ArrowUpRight, ArrowDownRight, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function FinancialAuditor() {
  const { sales, bank, bankSales, loading } = useRealData();
  const [showExpensesOnly, setShowExpensesOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("bank");

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

  // ─── Batch Reconciliation Logic ─────────────────────────
  const bankDeposits = useMemo(() => {
    return bankSales.filter((b) => b.money_in > 0).map((b) => ({
      ...b,
      amount: b.money_in,
    }));
  }, [bankSales]);

  const totalPOSSales = useMemo(() => sales.reduce((s, r) => s + r.total_sales, 0), [sales]);
  const totalDeposits = useMemo(() => bankDeposits.reduce((s, r) => s + r.amount, 0), [bankDeposits]);
  const reconGap = totalPOSSales - totalDeposits;

  // Group bank deposits by date for daily close view
  const dailyRecon = useMemo(() => {
    const byDate = new Map<string, { deposits: number; count: number; refs: string[] }>();
    bankDeposits.forEach((b) => {
      const d = b.date;
      if (!byDate.has(d)) byDate.set(d, { deposits: 0, count: 0, refs: [] });
      const entry = byDate.get(d)!;
      entry.deposits += b.amount;
      entry.count++;
      if (b.reference) entry.refs.push(b.reference);
    });
    return [...byDate.entries()]
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [bankDeposits]);

  const matchedDeposits = bankDeposits.filter((b) => b.reference).length;
  const unmatchedDeposits = bankDeposits.filter((b) => !b.reference).length;

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
          <p className="text-sm text-muted-foreground">December 2025 — Emerald Ledger v2.0</p>
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
          trendValue="After discounts"
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

      {/* Tabs: Bank Ledger vs Batch Reconciliation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="bank">Triple-Split Ledger</TabsTrigger>
          <TabsTrigger value="recon">Batch Reconciliation</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Triple-Split Bank Ledger ─────────────── */}
        <TabsContent value="bank" className="space-y-4 mt-4">
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

          {/* Triple-Split Bank Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Entity</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Reference</TableHead>
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
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-12">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBank.map((txn, i) => {
                      const isDeposit = txn.money_in > 0;
                      return (
                        <TableRow key={i} className="border-border hover:bg-secondary/40">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{txn.date}</TableCell>
                          <TableCell className="text-xs text-foreground font-medium max-w-[180px] truncate" title={txn.entity}>
                            {txn.entity || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-primary font-mono max-w-[160px] truncate" title={txn.reference}>
                            {txn.reference || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={txn.remark}>
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
        </TabsContent>

        {/* ─── TAB 2: Batch Reconciliation ─────────────────── */}
        <TabsContent value="recon" className="space-y-4 mt-4">
          {/* Recon Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="glass-card p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">POS Total</p>
              <p className="text-lg font-bold text-foreground">{fmt(totalPOSSales)}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bank Verified</p>
              <p className="text-lg font-bold text-success">{fmt(totalDeposits)}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Gap</p>
              <p className={cn("text-lg font-bold", reconGap > 0 ? "text-warning" : "text-success")}>
                {fmt(Math.abs(reconGap))}
              </p>
              <p className="text-[10px] text-muted-foreground">{reconGap > 0 ? "Unverified" : "Bank exceeds POS"}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Match Rate</p>
              <p className="text-lg font-bold text-primary">
                {bankDeposits.length > 0 ? ((matchedDeposits / bankDeposits.length) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-[10px] text-muted-foreground">{matchedDeposits} of {bankDeposits.length} with REF#</p>
            </div>
          </div>

          {/* Daily Close Table */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Daily Close — Bank Deposit Summary</h2>
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">Deposits</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">Txn Count</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">REF# Count</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyRecon.map((day) => {
                    const hasRefs = day.refs.length > 0;
                    return (
                      <TableRow key={day.date} className="border-border hover:bg-secondary/40">
                        <TableCell className="text-xs text-foreground font-medium">{day.date}</TableCell>
                        <TableCell className="text-xs text-right text-success font-mono">{fmt(day.deposits)}</TableCell>
                        <TableCell className="text-xs text-right">{day.count}</TableCell>
                        <TableCell className="text-xs text-right text-primary">{day.refs.length}</TableCell>
                        <TableCell className="text-center">
                          {hasRefs ? (
                            <CheckCircle className="h-4 w-4 text-success mx-auto" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-warning mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Unmatched Deposits (Theft/Error Alert) */}
          {unmatchedDeposits > 0 && (
            <div className="glass-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <h2 className="text-sm font-bold text-foreground">Missing REF# — Potential Errors</h2>
                <Badge variant="outline" className="text-[10px] bg-destructive/15 text-destructive border-destructive/30 ml-auto">
                  {unmatchedDeposits} UNMATCHED
                </Badge>
              </div>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Entity</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-right">Amount</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankDeposits.filter((b) => !b.reference).map((b, i) => (
                      <TableRow key={i} className="border-border bg-destructive/5 hover:bg-destructive/10">
                        <TableCell className="text-xs text-muted-foreground">{b.date}</TableCell>
                        <TableCell className="text-xs text-foreground font-medium">{b.entity || "—"}</TableCell>
                        <TableCell className="text-xs text-right text-destructive font-mono">{fmt(b.amount)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{b.remark || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
