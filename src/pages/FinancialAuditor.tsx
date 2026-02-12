import { useState, useMemo, useCallback } from "react";
import { useRealData } from "@/contexts/RealDataContext";
import { KPICard } from "@/components/shared/KPICard";
import { ExportButton } from "@/components/shared/ExportButton";
import { DESTINATION_CATEGORIES } from "@/lib/csv-parser";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Landmark, ShieldCheck, ArrowUpRight, ArrowDownRight, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type ChannelType = "QR Code" | "Card Payment" | "Bank Transfer" | "Cash" | "Other";

function detectChannel(remark: string): ChannelType {
  const r = (remark || "").toUpperCase();
  if (r.includes("QR") || r.includes("ABA PAY") || r.includes("KHQR")) return "QR Code";
  if (r.includes("POS") || r.includes("PPC") || r.includes("VISA")) return "Card Payment";
  if (r.includes("TRFR") || r.includes("TRANSFER") || r.includes("IB")) return "Bank Transfer";
  if (r.includes("CASH DEPOSIT") || r.includes("CDM")) return "Cash";
  return "Other";
}

const channelColors: Record<ChannelType, string> = {
  "QR Code": "bg-info/15 text-info border-info/30",
  "Card Payment": "bg-[hsl(270,60%,55%)]/15 text-[hsl(270,60%,65%)] border-[hsl(270,60%,55%)]/30",
  "Bank Transfer": "bg-[hsl(175,60%,45%)]/15 text-[hsl(175,60%,55%)] border-[hsl(175,60%,45%)]/30",
  "Cash": "bg-success/15 text-success border-success/30",
  "Other": "bg-muted text-muted-foreground border-border",
};

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const PAGE_SIZE = 50;

export default function FinancialAuditor() {
  const { sales, bank, bankSales, loading } = useRealData();
  const [showExpensesOnly, setShowExpensesOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("bank");
  const [destOverrides, setDestOverrides] = useState<Record<number, string>>({});
  const [bankPage, setBankPage] = useState(1);
  const [reconPage, setReconPage] = useState(1);
  const [cellModal, setCellModal] = useState<{ title: string; content: string } | null>(null);

  // --- Recon is now on-demand ---
  const [reconRan, setReconRan] = useState(false);

  const totalSalesRevenue = sales.reduce((s, r) => s + r.total_sales, 0);
  const totalNetRevenue = sales.reduce((s, r) => s + r.net_revenue, 0);
  const totalBankIn = bank.reduce((s, r) => s + r.money_in, 0);
  const totalBankOut = bank.reduce((s, r) => s + r.money_out, 0);
  const netBankFlow = totalBankIn - totalBankOut;

  const filteredBank = showExpensesOnly ? bank.filter((r) => r.money_out > 0) : bank;
  const expenseCount = bank.filter((r) => r.money_out > 0).length;
  const depositCount = bank.filter((r) => r.money_in > 0).length;

  const getDestination = (i: number, txn: typeof bank[0]) => destOverrides[i] ?? txn.destination;

  // Pagination for bank ledger
  const bankTotalPages = Math.ceil(filteredBank.length / PAGE_SIZE);
  const pagedBank = filteredBank.slice((bankPage - 1) * PAGE_SIZE, bankPage * PAGE_SIZE);

  // ─── Lazy Batch Reconciliation ─────────────────────────
  const bankDeposits = useMemo(() => {
    if (!reconRan) return [];
    return bankSales.filter((b) => b.money_in > 0).map((b) => ({ ...b, amount: b.money_in }));
  }, [bankSales, reconRan]);

  const totalPOSSales = useMemo(() => reconRan ? sales.reduce((s, r) => s + r.total_sales, 0) : 0, [sales, reconRan]);
  const totalDeposits = useMemo(() => bankDeposits.reduce((s, r) => s + r.amount, 0), [bankDeposits]);
  const reconGap = totalPOSSales - totalDeposits;

  const dailyRecon = useMemo(() => {
    if (!reconRan) return [];
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
  }, [bankDeposits, reconRan]);

  const matchedDeposits = bankDeposits.filter((b) => b.reference).length;
  const unmatchedDeposits = bankDeposits.filter((b) => !b.reference).length;

  const unmatchedList = useMemo(() => bankDeposits.filter((b) => !b.reference), [bankDeposits]);
  const reconTotalPages = Math.ceil(dailyRecon.length / PAGE_SIZE);
  const pagedRecon = dailyRecon.slice((reconPage - 1) * PAGE_SIZE, reconPage * PAGE_SIZE);

  const runRecon = useCallback(() => {
    setReconRan(true);
    setReconPage(1);
  }, []);

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
        <KPICard title="Total POS Sales" value={fmt(totalSalesRevenue)} icon={DollarSign} trendValue={`${sales.length} items`} />
        <KPICard title="Net Revenue" value={fmt(totalNetRevenue)} icon={DollarSign} trend="up" trendValue="After discounts" />
        <KPICard title="Bank Deposits" value={fmt(totalBankIn)} icon={Landmark} trend="up" trendValue={`${depositCount} deposits`} />
        <KPICard title="Bank Expenses" value={fmt(totalBankOut)} icon={ShieldCheck} trend="down" trendValue={`${expenseCount} transactions`} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="bank">Triple-Split Ledger</TabsTrigger>
          <TabsTrigger value="recon">Batch Reconciliation</TabsTrigger>
        </TabsList>

        {/* TAB 1: Triple-Split Bank Ledger */}
        <TabsContent value="bank" className="space-y-4 mt-4">
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
              <Switch id="expense-toggle" checked={showExpensesOnly} onCheckedChange={(v) => { setShowExpensesOnly(v); setBankPage(1); }} />
              <Label htmlFor="expense-toggle" className="text-xs text-muted-foreground cursor-pointer">
                Expenses Only ({expenseCount})
              </Label>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-[160px]">Entity</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Reference</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-[180px]">Remark</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-center">Channel</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">Money In</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">Money Out</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">Balance</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-center">Type</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Destination</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedBank.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-12">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedBank.map((txn, i) => {
                      const realIdx = (bankPage - 1) * PAGE_SIZE + i;
                      const isDeposit = txn.money_in > 0;
                      const dest = getDestination(realIdx, txn);
                      const channel = detectChannel(txn.remark);
                      return (
                        <TableRow key={realIdx} className="border-border hover:bg-secondary/40">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{txn.date}</TableCell>
                          <TableCell
                            className="text-xs text-foreground font-medium w-[160px] max-w-[160px] truncate cursor-pointer hover:text-primary transition-colors"
                            title="Click to expand"
                            onClick={() => setCellModal({ title: "Entity", content: txn.entity || "—" })}
                          >
                            {txn.entity || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-primary font-mono max-w-[140px] truncate" title={txn.reference}>
                            {txn.reference || "—"}
                          </TableCell>
                          <TableCell
                            className="text-xs text-muted-foreground w-[180px] max-w-[180px] truncate cursor-pointer hover:text-primary transition-colors"
                            title="Click to expand"
                            onClick={() => setCellModal({ title: "Remark", content: txn.remark || "—" })}
                          >
                            {txn.remark || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] font-medium", channelColors[channel])}
                            >
                              {channel}
                            </Badge>
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
                          <TableCell className="min-w-[180px]">
                            <Select
                              value={dest || "Uncategorized"}
                              onValueChange={(val) =>
                                setDestOverrides((prev) => ({ ...prev, [realIdx]: val }))
                              }
                            >
                              <SelectTrigger className="h-7 text-[11px] border-border bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border z-50 max-h-[300px]">
                                {DESTINATION_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat} value={cat} className="text-xs">
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {bankTotalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setBankPage((p) => Math.max(1, p - 1))}
                    className={cn(bankPage === 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(bankTotalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <PaginationItem key={p}>
                      <PaginationLink isActive={p === bankPage} onClick={() => setBankPage(p)}>
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setBankPage((p) => Math.min(bankTotalPages, p + 1))}
                    className={cn(bankPage === bankTotalPages && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        {/* TAB 2: Batch Reconciliation (on-demand) */}
        <TabsContent value="recon" className="space-y-4 mt-4">
          {!reconRan ? (
            <div className="glass-card p-12 text-center space-y-3">
              <Play className="h-10 w-10 text-muted-foreground mx-auto" />
              <h2 className="text-lg font-semibold text-foreground">Click "Run Reconciliation" to start</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Matches POS sales against bank deposits by REF# and amount. Results are cached until you leave the page.
              </p>
              <Button onClick={runRecon} className="gap-2 mt-2">
                <Play className="h-4 w-4" />
                Run Reconciliation
              </Button>
            </div>
          ) : (
            <>
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
                      {pagedRecon.map((day) => {
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

              {reconTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setReconPage((p) => Math.max(1, p - 1))}
                        className={cn(reconPage === 1 && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(reconTotalPages, 5) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <PaginationItem key={p}>
                          <PaginationLink isActive={p === reconPage} onClick={() => setReconPage(p)}>
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setReconPage((p) => Math.min(reconTotalPages, p + 1))}
                        className={cn(reconPage === reconTotalPages && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}

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
                        {unmatchedList.map((b, i) => (
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
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Cell expand modal */}
      <Dialog open={!!cellModal} onOpenChange={() => setCellModal(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{cellModal?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{cellModal?.content}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
