import { mockStaffMembers } from "@/lib/mock-data";
import { ExportButton } from "@/components/shared/ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Trophy, Medal } from "lucide-react";

export default function StaffIntelligence() {
  const ranked = [...mockStaffMembers]
    .filter((s) => s.salesPerHour > 0)
    .sort((a, b) => b.salesPerHour - a.salesPerHour);

  const allStaff = [...mockStaffMembers].sort((a, b) => b.salesTotal - a.salesTotal);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Staff Intelligence</h1>
          <p className="text-sm text-muted-foreground">Performance leaderboard & attendance</p>
        </div>
        <ExportButton label="Export PDF" />
      </div>

      {/* Leaderboard */}
      <div className="grid gap-4 sm:grid-cols-3">
        {ranked.slice(0, 3).map((s, i) => (
          <div key={s.id} className={cn(
            "glass-card p-5 flex items-center gap-4",
            i === 0 && "border-primary/30 glow-primary"
          )}>
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              i === 0 ? "bg-primary/20" : "bg-secondary"
            )}>
              {i === 0 ? <Trophy className="h-5 w-5 text-primary" /> : <Medal className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.role}</p>
              <p className="mt-1 text-lg font-bold text-primary">${s.salesPerHour.toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/hr</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* Full Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground text-xs">#</TableHead>
              <TableHead className="text-muted-foreground text-xs">Name</TableHead>
              <TableHead className="text-muted-foreground text-xs">Role</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right">Sales Total</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right">Hours</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right">$/Hour</TableHead>
              <TableHead className="text-muted-foreground text-xs text-center">Attendance</TableHead>
              <TableHead className="text-muted-foreground text-xs text-center">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStaff.map((s, i) => (
              <TableRow key={s.id} className="border-border hover:bg-secondary/40">
                <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="text-sm font-medium text-foreground">{s.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.role}</TableCell>
                <TableCell className="text-sm text-right font-medium text-foreground">${s.salesTotal.toLocaleString()}</TableCell>
                <TableCell className="text-xs text-right text-muted-foreground">{s.hoursWorked}h</TableCell>
                <TableCell className="text-sm text-right font-semibold text-primary">
                  {s.salesPerHour > 0 ? `$${s.salesPerHour.toFixed(2)}` : "—"}
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "text-xs font-semibold",
                    s.attendance >= 95 ? "text-success" : s.attendance >= 90 ? "text-warning" : "text-destructive"
                  )}>
                    {s.attendance}%
                  </span>
                </TableCell>
                <TableCell className="text-center text-xs text-foreground">⭐ {s.rating}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
