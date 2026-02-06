import { mockMenuItems } from "@/lib/mock-data";
import { ExportButton } from "@/components/shared/ExportButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tagStyles: Record<string, string> = {
  "Best Seller": "bg-success/15 text-success border-success/30",
  "Low Margin": "bg-destructive/15 text-destructive border-destructive/30",
  Standard: "bg-secondary text-muted-foreground border-border",
};

export default function MenuCogs() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Menu & COGS</h1>
          <p className="text-sm text-muted-foreground">Item-level profitability analysis</p>
        </div>
        <ExportButton label="Export Excel" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockMenuItems.map((item) => (
          <div key={item.id} className={cn(
            "glass-card p-4 flex flex-col gap-3 transition-all hover:glow-primary",
            item.tag === "Low Margin" && "border-destructive/20",
            item.tag === "Best Seller" && "border-primary/20",
          )}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.nameKh}</p>
              </div>
              <Badge variant="outline" className={cn("text-[10px] shrink-0", tagStyles[item.tag])}>
                {item.tag}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.category}</span>
              <span className="font-mono font-semibold text-foreground">${item.price.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-md bg-secondary/50 p-2">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Cost</p>
                <p className="text-xs font-semibold text-foreground">${item.cost.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Margin</p>
                <p className={cn("text-xs font-semibold", item.margin >= 50 ? "text-success" : "text-destructive")}>
                  {item.margin}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Sold</p>
                <p className="text-xs font-semibold text-foreground">{item.unitsSold}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-[10px] text-muted-foreground">Revenue</span>
              <span className="text-sm font-bold text-foreground">${item.revenue.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
