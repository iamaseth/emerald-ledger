import { usePeriod } from "@/contexts/PeriodContext";
import { PeriodToolbar } from "@/components/shared/PeriodToolbar";
import { KPICard } from "@/components/shared/KPICard";
import { ExportButton } from "@/components/shared/ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Banknote, QrCode, CreditCard, DollarSign, Landmark, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockBankTransactions } from "@/lib/mock-data";
import type { Bill } from "@/lib/mock-data";

type ReconciliationStatus = "Matched" | "Missing" | "Cash - Pending Deposit";

const statusConfig: Record<ReconciliationStatus, { emoji: string; className: string }> = {
  Matched: { emoji: "✅", className: "bg-success/15 text-success border-success/30" },
  Missing: { emoji: "❌", className: "bg-destructive/15 text-destructive border-destructive/30" },
  "Cash - Pending Deposit": { emoji: "💵", className: "bg-warning/15 text-warning border-warning/30" },
};

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

function PaymentIcon({ mode }: { mode: string }) {
  if (mode === "ABA QR") return <QrCode className="h-4 w-4 text-info" />;
  if (mode === "Card") return <CreditCard className="h-4 w-4 text-primary" />;
  return <Banknote className="h-4 w-4 text-success" />;
}

function getReconciliationStatus(bill: Bill): ReconciliationStatus {
  if (bill.payment_mode === "Cash") return "Cash - Pending Deposit";
  if (bill.aba_status === "Matched") return "Matched";
  return "Missing";
}

function getBankAmount(bill: Bill): number | null {
  const txn = mockBankTransactions.find((t) => t.matched_bill_id === bill.bill_id);
  return txn ? txn.amount : null;
}

export default function FinancialAuditor() {
  const { stats, periodLabel } = usePeriod();
  const bills = stats.filteredBills;

  const totalPOS = bills.reduce((s, b) => s + b.grand_total, 0);
  const totalBank = bills.reduce((s, b) => s + (getBankAmount(b) ?? 0), 0);
  const matchedCount = bills.filter((b) => getReconciliationStatus(b) === "Matched").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Financial Auditor</h1>
          <p className="text-sm text-muted-foreground">POS ↔ Bank reconciliation — {periodLabel}</p>
        </div>
        <ExportButton label="Export Excel" />
      </div>

      {/* Global Period Toggle */}
      <PeriodToolbar />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard
          title="Total POS Sales"
          value={fmt(totalPOS)}
          icon={DollarSign}
          trendValue={`${bills.length} transactions`}
        />
        <KPICard
          title="Total Bank Verified"
          value={fmt(totalBank)}
          icon={Landmark}
          trend={totalBank >= totalPOS ? "up" : "down"}
          trendValue={`${((totalBank / Math.max(totalPOS, 1)) * 100).toFixed(1)}% of POS`}
        />
        <KPICard
          title="Reconciliation"
          value={`${bills.length > 0 ? ((matchedCount / bills.length) * 100).toFixed(0) : 0}%`}
          icon={ShieldCheck}
          trend={matchedCount === bills.length ? "up" : "down"}
          trendValue={`${matchedCount}/${bills.length} matched`}
        />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground text-xs">Bill ID</TableHead>
                <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                <TableHead className="text-muted-foreground text-xs">Time</TableHead>
                <TableHead className="text-muted-foreground text-xs">Staff</TableHead>
                <TableHead className="text-muted-foreground text-xs text-center">Payment Type</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">POS Amount</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Bank Verified Amount</TableHead>
                <TableHead className="text-muted-foreground text-xs text-center">Status</TableHead>
                <TableHead className="text-muted-foreground text-xs text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-12">
                    No transactions for this period.
                  </TableCell>
                </TableRow>
              ) : (
                bills.map((b) => {
                  const status = getReconciliationStatus(b);
                  const bankAmount = getBankAmount(b);
                  const cfg = statusConfig[status];

                  return (
                    <TableRow key={b.bill_id} className="border-border hover:bg-secondary/40">
                      <TableCell className="font-mono text-xs text-foreground">{b.bill_id}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.date}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.timestamp}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.staff_name}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <PaymentIcon mode={b.payment_mode} />
                          <span className="text-xs text-muted-foreground">{b.payment_mode}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium text-foreground">
                        ${b.grand_total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium text-foreground">
                        {bankAmount !== null ? `$${bankAmount.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("font-medium text-xs", cfg.className)}>
                          {cfg.emoji} {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="text-xs h-7">
                          {status === "Matched" ? "View Receipt" : "Manual Verify"}
                        </Button>
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
