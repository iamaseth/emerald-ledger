import { useState, useCallback } from "react";
import { useRealData } from "@/contexts/RealDataContext";
import { KPICard } from "@/components/shared/KPICard";
import { ExportButton } from "@/components/shared/ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { CheckCircle, XCircle, DollarSign, Play, Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SalesRecord, BankStatementRecord } from "@/lib/csv-parser";

const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

type BankStatus = "matched" | "unmatched";

interface SalesLedgerLine {
  id: string;
  category: string;
  item_name: string;
  qty: number;
  price: number;
  cost: number;
  total_sales: number;
  net_revenue: number;
  profit: number;
  bankStatus: BankStatus;
  bankPartner: string;
  bankAmount: number;
}

const PPC_FEE_TOLERANCE = 0.03;
const PAGE_SIZE = 50;

/**
 * Sales-Led matching: for each sale item, search bank deposits for a match.
 * - ABA QR: match by REF ID containing item reference
 * - PPC Card: match by amount within 3% fee tolerance
 * - Fallback: try amount-based matching against remaining deposits
 */
function buildSalesLedger(
  sales: SalesRecord[],
  bankDeposits: BankStatementRecord[]
): SalesLedgerLine[] {
  const deposits = bankDeposits
    .filter((b) => b.money_in > 0)
    .map((b, i) => ({ ...b, _idx: i, _used: false }));

  return sales.map((sale, idx) => {
    const saleTotal = sale.total_sales;
    let bankStatus: BankStatus = "unmatched";
    let bankPartner = "";
    let bankAmount = 0;

    // Try exact amount match (ABA QR deposits with reference)
    const qrMatch = deposits.find(
      (d) => !d._used && d.reference && Math.abs(d.money_in - saleTotal) < 0.01
    );
    if (qrMatch) {
      qrMatch._used = true;
      bankStatus = "matched";
      bankPartner = qrMatch.entity || qrMatch.remark || "ABA QR";
      bankAmount = qrMatch.money_in;
    }

    // Try PPC card match (within 3% fee tolerance)
    if (bankStatus === "unmatched" && saleTotal > 0) {
      const cardMatch = deposits.find((d) => {
        if (d._used) return false;
        const details = d.transaction_details.toLowerCase();
        const isCard = details.includes("ppc") || details.includes("card") || details.includes("visa") || details.includes("master");
        if (!isCard) return false;
        const ratio = d.money_in / saleTotal;
        return ratio >= (1 - PPC_FEE_TOLERANCE) && ratio <= 1;
      });
      if (cardMatch) {
        cardMatch._used = true;
        bankStatus = "matched";
        bankPartner = cardMatch.entity || "Card Terminal";
        bankAmount = cardMatch.money_in;
      }
    }

    // Try general amount match for remaining
    if (bankStatus === "unmatched" && saleTotal > 0) {
      const amtMatch = deposits.find(
        (d) => !d._used && Math.abs(d.money_in - saleTotal) < 0.50
      );
      if (amtMatch) {
        amtMatch._used = true;
        bankStatus = "matched";
        bankPartner = amtMatch.entity || amtMatch.remark || "Bank Deposit";
        bankAmount = amtMatch.money_in;
      }
    }

    const cost = sale.cost;
    const profit = sale.total_sales - cost;

    return {
      id: `sale-${idx}`,
      category: sale.category,
      item_name: sale.item_name,
      qty: sale.qty,
      price: sale.price,
      cost,
      total_sales: saleTotal,
      net_revenue: sale.net_revenue,
      profit,
      bankStatus,
      bankPartner,
      bankAmount,
    };
  });
}

export default function Reconcile() {
  const { sales, bankSales, loading } = useRealData();
  const [activeTab, setActiveTab] = useState<"all" | BankStatus>("all");
  const [ledger, setLedger] = useState<SalesLedgerLine[] | null>(null);
  const [page, setPage] = useState(1);

  const runAudit = useCallback(() => {
    const result = buildSalesLedger(sales, bankSales);
    setLedger(result);
    setPage(1);
  }, [sales, bankSales]);

  const allLines = ledger ?? [];
  const matched = allLines.filter((l) => l.bankStatus === "matched");
  const unmatched = allLines.filter((l) => l.bankStatus === "unmatched");

  const totalSales = allLines.reduce((s, l) => s + l.total_sales, 0);
  const totalMatched = matched.reduce((s, l) => s + l.total_sales, 0);
  const totalUnmatched = unmatched.reduce((s, l) => s + l.total_sales, 0);
  const totalProfit = allLines.reduce((s, l) => s + l.profit, 0);

  const filtered =
    activeTab === "all" ? allLines :
    activeTab === "matched" ? matched : unmatched;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <h1 className="text-xl font-bold text-foreground">Sales Ledger — Reconciliator</h1>
          <p className="text-sm text-muted-foreground">December 2025 — Sales-Led Bank Matching</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={runAudit} className="gap-2">
            <Play className="h-4 w-4" />
            {ledger ? "Re-run Audit" : "Run Audit"}
          </Button>
          <ExportButton label="Export Report" />
        </div>
      </div>

      {!ledger ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Search className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Click "Run Audit" to match Sales → Bank</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Every POS sale row becomes the source of truth. The engine searches bank deposits for matching amounts via ABA QR (REF ID), PPC Card (3% tolerance), and general amount match.
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-4">
            <KPICard title="Total POS Sales" value={fmt(totalSales)} icon={DollarSign} trendValue={`${allLines.length} items`} />
            <KPICard title="Bank Matched" value={fmt(totalMatched)} icon={CheckCircle} trend="up" trendValue={`${matched.length} items verified`} />
            <KPICard title="No Bank Match" value={fmt(totalUnmatched)} icon={XCircle} trend="down" trendValue={`${unmatched.length} items flagged`} />
            <KPICard title="Est. Gross Profit" value={fmt(totalProfit)} icon={TrendingUp} trendValue="COG-linked" />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); setPage(1); }}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All ({allLines.length})</TabsTrigger>
              <TabsTrigger value="matched">🟢 Matched ({matched.length})</TabsTrigger>
              <TabsTrigger value="unmatched">🔴 No Match ({unmatched.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 space-y-3">
              <div className="glass-card overflow-hidden">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="text-muted-foreground text-xs">Category</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Item Name</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-right">Qty</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-right">Total Sales</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-right">Cost (COG)</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-right">Profit</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-center">Bank Status</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Bank Partner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-12">
                            No items in this category.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paged.map((line) => (
                          <TableRow
                            key={line.id}
                            className={cn(
                              "border-border",
                              line.bankStatus === "unmatched" && "bg-destructive/5 hover:bg-destructive/10",
                              line.bankStatus === "matched" && "hover:bg-secondary/40"
                            )}
                          >
                            <TableCell className="text-xs text-muted-foreground">{line.category}</TableCell>
                            <TableCell className="text-xs text-foreground font-medium max-w-[200px] truncate" title={line.item_name}>
                              {line.item_name}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono">{line.qty.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{fmt(line.total_sales)}</TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              {line.cost > 0 ? (
                                fmt(line.cost)
                              ) : (
                                <span className="text-warning">$0.00</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              {line.profit > 0 ? (
                                <span className="text-success">{fmt(line.profit)}</span>
                              ) : (
                                <span className="text-muted-foreground">{fmt(line.profit)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-medium",
                                  line.bankStatus === "matched"
                                    ? "bg-success/15 text-success border-success/30"
                                    : "bg-destructive/15 text-destructive border-destructive/30"
                                )}
                              >
                                {line.bankStatus === "matched" ? "🟢 Matched" : "🔴 No Match"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-foreground max-w-[140px] truncate" title={line.bankPartner}>
                              {line.bankPartner || "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={cn(page === 1 && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <PaginationItem key={p}>
                          <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className={cn(page === totalPages && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </TabsContent>
          </Tabs>

          {/* Unmatched Alert */}
          {unmatched.length > 0 && (
            <div className="glass-card p-5 space-y-2 border-l-4 border-destructive">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <h2 className="text-sm font-bold text-foreground">⚠ Sales Without Bank Verification</h2>
                <Badge variant="outline" className="text-[10px] bg-destructive/15 text-destructive border-destructive/30 ml-auto">
                  {unmatched.length} UNMATCHED — {fmt(totalUnmatched)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                These POS sales could not be matched to any bank deposit. Revenue may be undeposited or requires manual review.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
