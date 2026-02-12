import { useState, useMemo, useCallback } from "react";
import { useRealData } from "@/contexts/RealDataContext";
import { KPICard } from "@/components/shared/KPICard";
import { ExportButton } from "@/components/shared/ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { CheckCircle, AlertTriangle, XCircle, DollarSign, CreditCard, Banknote, QrCode, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

type MatchStatus = "matched" | "partial" | "unmatched";
type Channel = "ABA QR" | "PPC Card" | "Cash" | "Unknown";

interface ReconLine {
  id: string;
  date: string;
  channel: Channel;
  posAmount: number;
  bankAmount: number;
  posRef: string;
  bankRef: string;
  entity: string;
  status: MatchStatus;
  gap: number;
  itemName: string;
}

const PPC_FEE_TOLERANCE = 0.03;
const PAGE_SIZE = 50;

function buildReconLines(bankSales: ReturnType<typeof useRealData>["bankSales"]): ReconLine[] {
  const lines: ReconLine[] = [];
  const usedBankIdxs = new Set<number>();
  const allDeposits = bankSales.filter((b) => b.money_in > 0);

  // ABA QR
  allDeposits.forEach((dep, bIdx) => {
    if (!dep.reference) return;
    lines.push({
      id: `aba-${bIdx}`, date: dep.date, channel: "ABA QR",
      posAmount: dep.money_in, bankAmount: dep.money_in,
      posRef: dep.reference, bankRef: dep.reference,
      entity: dep.entity, status: "matched", gap: 0,
      itemName: dep.remark || "ABA QR Payment",
    });
    usedBankIdxs.add(bIdx);
  });

  // PPC Card
  allDeposits.forEach((dep, bIdx) => {
    if (usedBankIdxs.has(bIdx)) return;
    const details = dep.transaction_details.toLowerCase();
    if (!details.includes("ppc") && !details.includes("card") && !details.includes("visa") && !details.includes("master")) return;
    const expectedPOS = dep.money_in / (1 - PPC_FEE_TOLERANCE);
    lines.push({
      id: `ppc-${bIdx}`, date: dep.date, channel: "PPC Card",
      posAmount: expectedPOS, bankAmount: dep.money_in,
      posRef: "—", bankRef: dep.reference || "—",
      entity: dep.entity || "Card Terminal", status: "partial",
      gap: expectedPOS - dep.money_in,
      itemName: dep.remark || "Card Payment (3% fee)",
    });
    usedBankIdxs.add(bIdx);
  });

  // Cash
  const cashDeposits = allDeposits.filter((dep, bIdx) => {
    if (usedBankIdxs.has(bIdx)) return false;
    const d = dep.transaction_details.toLowerCase();
    return d.includes("cash deposit") || d.includes("cash");
  });
  cashDeposits.forEach((dep, i) => {
    const bIdx = allDeposits.indexOf(dep);
    lines.push({
      id: `cash-${i}`, date: dep.date, channel: "Cash",
      posAmount: dep.money_in, bankAmount: dep.money_in,
      posRef: "CASH", bankRef: dep.reference || "CASH",
      entity: dep.entity || "Cash Deposit", status: "matched", gap: 0,
      itemName: "Cash Deposit",
    });
    usedBankIdxs.add(bIdx);
  });

  // Unmatched
  allDeposits.forEach((dep, bIdx) => {
    if (usedBankIdxs.has(bIdx)) return;
    lines.push({
      id: `unk-${bIdx}`, date: dep.date, channel: "Unknown",
      posAmount: 0, bankAmount: dep.money_in,
      posRef: "—", bankRef: dep.reference || "—",
      entity: dep.entity || "Unknown", status: "unmatched",
      gap: dep.money_in,
      itemName: dep.remark || dep.transaction_details.slice(0, 40),
    });
  });

  return lines.sort((a, b) => a.date.localeCompare(b.date));
}

export default function Reconcile() {
  const { sales, bankSales, loading } = useRealData();
  const [activeTab, setActiveTab] = useState<"all" | MatchStatus>("all");
  const [reconLines, setReconLines] = useState<ReconLine[] | null>(null);
  const [page, setPage] = useState(1);

  const runAudit = useCallback(() => {
    const result = buildReconLines(bankSales);
    setReconLines(result);
    setPage(1);
  }, [bankSales]);

  const matched = useMemo(() => reconLines?.filter((l) => l.status === "matched") ?? [], [reconLines]);
  const partial = useMemo(() => reconLines?.filter((l) => l.status === "partial") ?? [], [reconLines]);
  const unmatched = useMemo(() => reconLines?.filter((l) => l.status === "unmatched") ?? [], [reconLines]);

  const totalBankVerified = matched.reduce((s, l) => s + l.bankAmount, 0) + partial.reduce((s, l) => s + l.bankAmount, 0);
  const totalUnmatched = unmatched.reduce((s, l) => s + l.bankAmount, 0);
  const totalPOS = sales.reduce((s, r) => s + r.total_sales, 0);

  const allLines = reconLines ?? [];
  const filtered =
    activeTab === "all" ? allLines :
    activeTab === "matched" ? matched :
    activeTab === "partial" ? partial : unmatched;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const channelIcon = (ch: Channel) => {
    switch (ch) {
      case "ABA QR": return <QrCode className="h-3.5 w-3.5" />;
      case "PPC Card": return <CreditCard className="h-3.5 w-3.5" />;
      case "Cash": return <Banknote className="h-3.5 w-3.5" />;
      default: return <AlertTriangle className="h-3.5 w-3.5" />;
    }
  };

  const statusBadge = (s: MatchStatus) => {
    const map = {
      matched: { label: "🟢 Matched", cls: "bg-success/15 text-success border-success/30" },
      partial: { label: "🟡 Partial", cls: "bg-warning/15 text-warning border-warning/30" },
      unmatched: { label: "🔴 Unmatched", cls: "bg-destructive/15 text-destructive border-destructive/30" },
    };
    const { label, cls } = map[s];
    return <Badge variant="outline" className={cn("text-[10px] font-medium", cls)}>{label}</Badge>;
  };

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
          <h1 className="text-xl font-bold text-foreground">Multi-Channel Reconciliator</h1>
          <p className="text-sm text-muted-foreground">December 2025 — POS ↔ Bank Matching Engine</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={runAudit} className="gap-2">
            <Play className="h-4 w-4" />
            {reconLines ? "Re-run Audit" : "Run Audit"}
          </Button>
          <ExportButton label="Export Recon Report" />
        </div>
      </div>

      {!reconLines ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Play className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Click "Run Audit" to start reconciliation</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The matching algorithm will compare POS sales against bank deposits using REF#, card amounts (3% fee tolerance), and cash deposits.
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-4">
            <KPICard title="Total POS Sales" value={fmt(totalPOS)} icon={DollarSign} trendValue={`${sales.length} line items`} />
            <KPICard title="Bank Verified" value={fmt(totalBankVerified)} icon={CheckCircle} trend="up" trendValue={`${matched.length + partial.length} deposits`} />
            <KPICard title="Unmatched Deposits" value={fmt(totalUnmatched)} icon={XCircle} trend="down" trendValue={`${unmatched.length} flagged`} />
            <KPICard
              title="Match Rate"
              value={`${allLines.length > 0 ? ((matched.length / allLines.length) * 100).toFixed(1) : 0}%`}
              icon={CheckCircle}
              trendValue={`${matched.length} of ${allLines.length}`}
            />
          </div>

          {/* Status Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); setPage(1); }}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All ({allLines.length})</TabsTrigger>
              <TabsTrigger value="matched">🟢 Matched ({matched.length})</TabsTrigger>
              <TabsTrigger value="partial">🟡 Partial ({partial.length})</TabsTrigger>
              <TabsTrigger value="unmatched">🔴 Unmatched ({unmatched.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 space-y-3">
              <div className="glass-card overflow-hidden">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Channel</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Entity</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Description</TableHead>
                        <TableHead className="text-muted-foreground text-xs">POS Ref</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-right">POS Amount</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-right">Bank Amount</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-right">Gap</TableHead>
                        <TableHead className="text-muted-foreground text-xs text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-12">
                            No transactions in this category.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paged.map((line) => (
                          <TableRow
                            key={line.id}
                            className={cn(
                              "border-border",
                              line.status === "unmatched" && "bg-destructive/5 hover:bg-destructive/10",
                              line.status === "partial" && "bg-warning/5 hover:bg-warning/10",
                              line.status === "matched" && "hover:bg-secondary/40"
                            )}
                          >
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{line.date}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-xs text-foreground">
                                {channelIcon(line.channel)}
                                <span className="font-medium">{line.channel}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-foreground font-medium max-w-[140px] truncate">{line.entity}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate" title={line.itemName}>{line.itemName}</TableCell>
                            <TableCell className="text-xs text-primary font-mono">{line.posRef}</TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              {line.posAmount > 0 ? fmt(line.posAmount) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono text-success">{fmt(line.bankAmount)}</TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              {line.gap > 0.01 ? (
                                <span className="text-warning">{fmt(line.gap)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{statusBadge(line.status)}</TableCell>
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
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                <h2 className="text-sm font-bold text-foreground">⚠ Potential Theft / Loss Alert</h2>
                <Badge variant="outline" className="text-[10px] bg-destructive/15 text-destructive border-destructive/30 ml-auto">
                  {unmatched.length} UNMATCHED — {fmt(totalUnmatched)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                These bank deposits could not be matched to any POS record via REF#, card terminal amount, or cash deposit.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
