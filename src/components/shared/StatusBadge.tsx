import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Status = "Matched" | "Mismatch" | "Unpaid" | "Ghost Payment";

const statusStyles: Record<Status, string> = {
  Matched: "bg-success/15 text-success border-success/30",
  Mismatch: "bg-warning/15 text-warning border-warning/30",
  Unpaid: "bg-destructive/15 text-destructive border-destructive/30",
  "Ghost Payment": "bg-info/15 text-info border-info/30",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", statusStyles[status])}>
      {status}
    </Badge>
  );
}
