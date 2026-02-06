import { mockBills, mockBankTransactions } from "@/lib/mock-data";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ExportButton } from "@/components/shared/ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

      <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
        {/* POS Bills */}
        <div className="glass-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">MobiPOS Bills</h2>
          </div>
          <div className="overflow-auto max-h-[520px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground text-xs">Bill ID</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Time</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Table</TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">Total</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Staff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockBills.map((b) => (
                  <TableRow key={b.id} className="border-border hover:bg-secondary/40">
                    <TableCell className="font-mono text-xs text-foreground">{b.id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.time}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.table}</TableCell>
                    <TableCell className="text-xs text-right font-medium text-foreground">${b.total.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.staff}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Status Column */}
        <div className="glass-card w-40 overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground text-center">Status</h2>
          </div>
          <div className="overflow-auto max-h-[520px]">
            <div className="flex flex-col">
              {mockBills.map((b) => (
                <div key={b.id} className="flex items-center justify-center border-b border-border px-2 py-[13px]">
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bank Transactions */}
        <div className="glass-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">ABA Bank QR Transactions</h2>
          </div>
          <div className="overflow-auto max-h-[520px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground text-xs">ABA Ref</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Time</TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">Amount</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Sender</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockBankTransactions.map((t) => (
                  <TableRow key={t.id} className="border-border hover:bg-secondary/40">
                    <TableCell className="font-mono text-xs text-foreground">{t.ref}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.time}</TableCell>
                    <TableCell className="text-xs text-right font-medium text-foreground">${t.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.sender}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
