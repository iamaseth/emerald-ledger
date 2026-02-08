import { useState } from "react";
import { usePeriod } from "@/contexts/PeriodContext";
import { PeriodToolbar } from "@/components/shared/PeriodToolbar";
import { KPICard } from "@/components/shared/KPICard";
import { ExportButton } from "@/components/shared/ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Banknote, QrCode, CreditCard, DollarSign, Landmark, ShieldCheck, CheckCircle, AlertTriangle, XCircle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockBankTransactions } from "@/lib/mock-data";
import { calcVAT, calcPLT, fmtUSD, VAT_RATE, PLT_RATE } from "@/lib/tax";
import type { Bill } from "@/lib/mock-data";

type ReconciliationStatus = "Matched" | "Mismatch" | "Missing" | "Cash" | "Manual";

const statusConfig: Record<ReconciliationStatus, { icon: typeof CheckCircle; label: string; className: string; iconClass: string }> = {
  Matched:  { icon: CheckCircle,    label: "Matched",  className: "bg-success/15 text-success border-success/30",           iconClass: "text-success" },
  Mismatch: { icon: AlertTriangle,  label: "Mismatch", className: "bg-warning/15 text-warning border-warning/30",           iconClass: "text-warning" },
  Missing:  { icon: XCircle,        label: "Missing",  className: "bg-destructive/15 text-destructive border-destructive/30", iconClass: "text-destructive" },
  Cash:     { icon: Banknote,       label: "Cash",     className: "bg-info/15 text-info border-info/30",                     iconClass: "text-info" },
  Manual:   { icon: Wrench,         label: "Manual",   className: "bg-muted text-muted-foreground border-border",            iconClass: "text-muted-foreground" },
};

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

const fmtTax = (n: number) => fmtUSD(n);
function PaymentIcon({ mode }: { mode: string }) {
  if (mode === "ABA QR") return <QrCode className="h-4 w-4 text-info" />;
  if (mode === "Card") return <CreditCard className="h-4 w-4 text-primary" />;
  return <Banknote className="h-4 w-4 text-success" />;
}

function getReconciliationStatus(bill: Bill): ReconciliationStatus {
  if (bill.payment_mode === "Cash") return "Cash";
  if (bill.aba_status === "Matched") return "Matched";
  if (bill.aba_status === "Mismatch") return "Mismatch";
  if (bill.aba_status === "Ghost Payment") return "Manual";
  return "Missing";
}

function getBankAmount(bill: Bill): number | null {
  const txn = mockBankTransactions.find((t) => t.matched_bill_id === bill.bill_id);
  return txn ? txn.amount : null;
}

function isDiscrepancy(status: ReconciliationStatus): boolean {
  return status !== "Matched";
}

export default function FinancialAuditor() {
  const { stats, periodLabel } = usePeriod();
  const [discrepancyOnly, setDiscrepancyOnly] = useState(false);

  const allBills = stats.filteredBills;
  const bills = discrepancyOnly
    ? allBills.filter((b) => isDiscrepancy(getReconciliationStatus(b)))
    : allBills;

  const totalPOS = allBills.reduce((s, b) => s + b.grand_total, 0);
  const totalBank = allBills.reduce((s, b) => s + (getBankAmount(b) ?? 0), 0);
  const totalVAT = allBills.reduce((s, b) => s + calcVAT(b.grand_total), 0);
  const totalPLT = allBills.reduce((s, b) => s + calcPLT(b.grand_total), 0); // simplified: apply PLT to all for demo
  const matchedCount = allBills.filter((b) => getReconciliationStatus(b) === "Matched").length;
  const discrepancyCount = allBills.length - matchedCount;

  // Status breakdown counts
  const statusCounts = allBills.reduce<Record<ReconciliationStatus, number>>(
    (acc, b) => {
      const s = getReconciliationStatus(b);
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    { Matched: 0, Mismatch: 0, Missing: 0, Cash: 0, Manual: 0 }
  );

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
          trendValue={`${allBills.length} transactions`}
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
          value={`${allBills.length > 0 ? ((matchedCount / allBills.length) * 100).toFixed(0) : 0}%`}
          icon={ShieldCheck}
          trend={matchedCount === allBills.length ? "up" : "down"}
          trendValue={`${matchedCount}/${allBills.length} matched`}
        />
      </div>

      {/* Status Legend + Discrepancy Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {(Object.entries(statusConfig) as [ReconciliationStatus, typeof statusConfig.Matched][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                <Icon className={cn("h-3.5 w-3.5", cfg.iconClass)} />
                <span className="text-muted-foreground">{cfg.label}</span>
                <span className="font-medium text-foreground">{statusCounts[key]}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="discrepancy-toggle"
            checked={discrepancyOnly}
            onCheckedChange={setDiscrepancyOnly}
          />
          <Label htmlFor="discrepancy-toggle" className="text-xs text-muted-foreground cursor-pointer">
            Discrepancy Only ({discrepancyCount})
          </Label>
        </div>
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
                <TableHead className="text-muted-foreground text-xs text-right">VAT ({(VAT_RATE * 100).toFixed(0)}%)</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">PLT ({(PLT_RATE * 100).toFixed(0)}%)</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Bank Verified</TableHead>
                <TableHead className="text-muted-foreground text-xs text-center">Status</TableHead>
                <TableHead className="text-muted-foreground text-xs text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-sm text-muted-foreground py-12">
                    {discrepancyOnly ? "No discrepancies found 🎉" : "No transactions for this period."}
                  </TableCell>
                </TableRow>
              ) : (
                bills.map((b) => {
                  const status = getReconciliationStatus(b);
                  const bankAmount = getBankAmount(b);
                  const vat = calcVAT(b.grand_total);
                  const plt = calcPLT(b.grand_total);
                  const cfg = statusConfig[status];
                  const StatusIcon = cfg.icon;

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
                      <TableCell className="text-xs text-right font-mono text-primary">
                        {fmtTax(vat)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono text-warning">
                        {fmtTax(plt)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium text-foreground">
                        {bankAmount !== null ? `$${bankAmount.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("font-medium text-xs gap-1", cfg.className)}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
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
