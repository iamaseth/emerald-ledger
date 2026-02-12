import { useState, useMemo } from "react";
import { KPICard } from "@/components/shared/KPICard";
import { ExportButton } from "@/components/shared/ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { CheckCircle, XCircle, DollarSign, AlertTriangle, Database, Upload, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateGhostData, type GhostTransaction } from "@/lib/ghost-ledger-data";

const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

type DataSource = "mock" | "csv" | "api";
type FilterTab = "all" | "matched" | "missing";

const PAGE_SIZE = 50;

export default function Reconcile() {
  const [dataSource, setDataSource] = useState<DataSource>("mock");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);

  // Generate ghost data once (stable via useMemo)
  const ghostData = useMemo(() => generateGhostData(), []);

  const matched = ghostData.filter((t) => t.bankStatus === "matched");
  const missing = ghostData.filter((t) => t.bankStatus === "missing");

  const totalPOS = ghostData.reduce((s, t) => s + t.amount, 0);
  const totalMatched = matched.reduce((s, t) => s + t.amount, 0);
  const totalMissing = missing.reduce((s, t) => s + t.amount, 0);

  const filtered: GhostTransaction[] =
    activeTab === "all" ? ghostData :
    activeTab === "matched" ? matched : missing;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Ghost Ledger — Sequential Audit</h1>
          <p className="text-sm text-muted-foreground">Dec 15, 2025 — Minute-by-Minute POS → Bank Match</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton label="Export Report" />
        </div>
      </div>

      {/* Data Source Toggle */}
      <div className="glass-card p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Data Source</p>
        <ToggleGroup
          type="single"
          value={dataSource}
          onValueChange={(v) => { if (v) setDataSource(v as DataSource); }}
          className="justify-start gap-2"
        >
          <ToggleGroupItem value="mock" className="gap-2 data-[state=on]:bg-primary/20 data-[state=on]:text-primary border border-border px-4">
            <Database className="h-4 w-4" />
            Mock Data
          </ToggleGroupItem>
          <ToggleGroupItem value="csv" className="gap-2 data-[state=on]:bg-primary/20 data-[state=on]:text-primary border border-border px-4" disabled>
            <Upload className="h-4 w-4" />
            Upload CSV
          </ToggleGroupItem>
          <ToggleGroupItem value="api" className="gap-2 data-[state=on]:bg-primary/20 data-[state=on]:text-primary border border-border px-4" disabled>
            <Wifi className="h-4 w-4" />
            ABA API
          </ToggleGroupItem>
        </ToggleGroup>
        {dataSource === "csv" && (
          <p className="text-xs text-muted-foreground mt-2">CSV upload coming soon — upload your Sale.csv and Bank Statement.</p>
        )}
        {dataSource === "api" && (
          <p className="text-xs text-muted-foreground mt-2">ABA API integration requires API keys. Contact support.</p>
        )}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <KPICard title="Total POS Sales" value={fmt(totalPOS)} icon={DollarSign} trendValue={`${ghostData.length} bills`} />
        <KPICard title="Bank Matched" value={fmt(totalMatched)} icon={CheckCircle} trend="up" trendValue={`${matched.length} verified`} />
        <KPICard title="Missing Deposits" value={fmt(totalMissing)} icon={XCircle} trend="down" trendValue={`${missing.length} flagged`} />
        <KPICard title="Match Rate" value={`${Math.round((matched.length / ghostData.length) * 100)}%`} icon={AlertTriangle} trendValue="target: 100%" />
      </div>

      {/* Filter Tabs + Table */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as FilterTab); setPage(1); }}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">All ({ghostData.length})</TabsTrigger>
          <TabsTrigger value="matched">🟢 Matched ({matched.length})</TabsTrigger>
          <TabsTrigger value="missing">🔴 Missing ({missing.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          <div className="glass-card overflow-hidden">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-muted-foreground text-xs w-[100px]">Time</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-[100px]">Bill ID</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right w-[120px]">POS Amount</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-[100px]">Payment</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-center w-[160px]">Bank Status</TableHead>
                    <TableHead className="text-muted-foreground text-xs w-[180px]">Bank Reference</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right w-[120px]">Bank Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">
                        No transactions in this view.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paged.map((tx) => (
                      <TableRow
                        key={tx.id}
                        className={cn(
                          "border-border",
                          tx.bankStatus === "missing" && "bg-destructive/5 hover:bg-destructive/10",
                          tx.bankStatus === "matched" && "hover:bg-secondary/40"
                        )}
                      >
                        <TableCell className="text-xs font-mono text-foreground">{tx.time}</TableCell>
                        <TableCell className="text-xs font-medium text-foreground">{tx.billId}</TableCell>
                        <TableCell className="text-xs text-right font-mono text-foreground">{fmt(tx.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium",
                              tx.paymentMethod === "QR" && "bg-info/15 text-info border-info/30",
                              tx.paymentMethod === "Card" && "bg-warning/15 text-warning border-warning/30",
                              tx.paymentMethod === "Cash" && "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {tx.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium",
                              tx.bankStatus === "matched"
                                ? "bg-success/15 text-success border-success/30"
                                : "bg-destructive/15 text-destructive border-destructive/30"
                            )}
                          >
                            {tx.bankStatus === "matched" ? "🟢 MATCHED" : "🔴 MISSING DEPOSIT"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-foreground">
                          {tx.bankRef || <span className="text-destructive">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          {tx.bankStatus === "matched" ? (
                            <span className={cn(
                              tx.bankAmount < tx.amount ? "text-warning" : "text-success"
                            )}>
                              {fmt(tx.bankAmount)}
                              {tx.paymentMethod === "Card" && (
                                <span className="text-[9px] text-muted-foreground ml-1">(-3%)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-destructive">$0.00</span>
                          )}
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

      {/* Missing Deposits Alert */}
      {missing.length > 0 && (
        <div className="glass-card p-5 space-y-2 border-l-4 border-destructive">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-bold text-foreground">⚠ Missing Bank Deposits</h2>
            <Badge variant="outline" className="text-[10px] bg-destructive/15 text-destructive border-destructive/30 ml-auto">
              {missing.length} MISSING — {fmt(totalMissing)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            These POS transactions have no matching bank deposit. Revenue may be undeposited, stolen, or requires manual review.
          </p>
        </div>
      )}
    </div>
  );
}
