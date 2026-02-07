import { mockBills, mockBankTransactions } from "@/lib/mock-data";
import { ExportButton } from "@/components/shared/ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Banknote, QrCode, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

type ReconciliationStatus = "Matched" | "Missing" | "Cash - Pending Deposit";

const statusConfig: Record<ReconciliationStatus, { emoji: string; className: string }> = {
  Matched: { emoji: "✅", className: "bg-success/15 text-success border-success/30" },
  Missing: { emoji: "❌", className: "bg-destructive/15 text-destructive border-destructive/30" },
  "Cash - Pending Deposit": { emoji: "💵", className: "bg-warning/15 text-warning border-warning/30" },
};

function PaymentIcon({ mode }: { mode: string }) {
  if (mode === "ABA QR") return <QrCode className="h-4 w-4 text-info" />;
  if (mode === "Card") return <CreditCard className="h-4 w-4 text-primary" />;
  return <Banknote className="h-4 w-4 text-success" />;
}

function getReconciliationStatus(bill: typeof mockBills[0]): ReconciliationStatus {
  if (bill.payment_mode === "Cash") return "Cash - Pending Deposit";
  if (bill.aba_status === "Matched") return "Matched";
  return "Missing";
}

function getBankAmount(bill: typeof mockBills[0]): number | null {
  const txn = mockBankTransactions.find((t) => t.matched_bill_id === bill.bill_id);
  return txn ? txn.amount : null;
}

export default function FinancialAuditor() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Financial Auditor</h1>
          <p className="text-sm text-muted-foreground">POS ↔ Bank reconciliation — Feb 6, 2025</p>
        </div>
        <ExportButton label="Export Excel" />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground text-xs">Bill ID</TableHead>
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
              {mockBills.map((b) => {
                const status = getReconciliationStatus(b);
                const bankAmount = getBankAmount(b);
                const cfg = statusConfig[status];

                return (
                  <TableRow key={b.bill_id} className="border-border hover:bg-secondary/40">
                    <TableCell className="font-mono text-xs text-foreground">{b.bill_id}</TableCell>
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
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
