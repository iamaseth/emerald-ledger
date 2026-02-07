import { mockAuditActions } from "@/lib/mock-data";
import { ExportButton } from "@/components/shared/ExportButton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const typeStyles: Record<string, string> = {
  Void: "bg-destructive/15 text-destructive border-destructive/30",
  "Bill Deletion": "bg-warning/15 text-warning border-warning/30",
  "Manual Discount": "bg-info/15 text-info border-info/30",
};

export default function AuditLog() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">The Audit Log</h1>
          <p className="text-sm text-muted-foreground">High-risk action tracking</p>
        </div>
        <ExportButton label="Export PDF" />
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground text-xs">Type</TableHead>
              <TableHead className="text-muted-foreground text-xs">Staff Member</TableHead>
              <TableHead className="text-muted-foreground text-xs">Date</TableHead>
              <TableHead className="text-muted-foreground text-xs">Time</TableHead>
              <TableHead className="text-muted-foreground text-xs">Bill ID</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right">Amount</TableHead>
              <TableHead className="text-muted-foreground text-xs">Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAuditActions.map((a) => (
              <TableRow key={a.id} className="border-border hover:bg-secondary/40">
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs font-medium", typeStyles[a.type])}>
                    {a.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-foreground font-medium">{a.staff_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{a.date}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{a.timestamp}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{a.bill_id}</TableCell>
                <TableCell className="text-sm text-right font-medium text-destructive">${a.amount.toFixed(2)}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">{a.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
