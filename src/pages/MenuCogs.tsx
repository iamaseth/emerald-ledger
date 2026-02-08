import { useState } from "react";
import { mockMenuItems } from "@/lib/mock-data";
import { ExportButton } from "@/components/shared/ExportButton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { calcTaxBreakdown, isPLTApplicable, fmtUSD, VAT_RATE, PLT_RATE } from "@/lib/tax";

const tagStyles: Record<string, string> = {
  "Best Seller": "bg-success/15 text-success border-success/30",
  "Low Margin": "bg-destructive/15 text-destructive border-destructive/30",
  Standard: "bg-secondary text-muted-foreground border-border",
};

interface TaxFlags {
  vat: boolean;
  plt: boolean;
}

export default function MenuCogs() {
  // Per-item tax toggles — default: VAT on for all, PLT on if category applies
  const [taxFlags, setTaxFlags] = useState<Record<string, TaxFlags>>(() => {
    const initial: Record<string, TaxFlags> = {};
    mockMenuItems.forEach((item) => {
      initial[item.id] = { vat: true, plt: isPLTApplicable(item.category) };
    });
    return initial;
  });

  const toggleFlag = (id: string, flag: "vat" | "plt") => {
    setTaxFlags((prev) => ({
      ...prev,
      [id]: { ...prev[id], [flag]: !prev[id][flag] },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Menu & COGS</h1>
          <p className="text-sm text-muted-foreground">Item-level profitability with tax compliance</p>
        </div>
        <ExportButton label="Export Excel" />
      </div>

      {/* Tax rate legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" />
          VAT {(VAT_RATE * 100).toFixed(0)}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" />
          PLT {(PLT_RATE * 100).toFixed(0)}% (Alcohol/Tobacco)
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockMenuItems.map((item) => {
          const flags = taxFlags[item.id];
          const tax = calcTaxBreakdown(item.price, flags.vat, flags.plt);

          return (
            <div key={item.id} className={cn(
              "glass-card p-4 flex flex-col gap-3 transition-all hover:glow-primary",
              item.tag === "Low Margin" && "border-destructive/20",
              item.tag === "Best Seller" && "border-primary/20",
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.name_kh}</p>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", tagStyles[item.tag])}>
                  {item.tag}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.category}</span>
                <span className="font-mono font-semibold text-foreground">{fmtUSD(item.price)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-md bg-secondary/50 p-2">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Cost</p>
                  <p className="text-xs font-semibold text-foreground">{fmtUSD(item.cost)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Margin</p>
                  <p className={cn("text-xs font-semibold", item.margin >= 50 ? "text-success" : "text-destructive")}>
                    {item.margin}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Sold</p>
                  <p className="text-xs font-semibold text-foreground">{item.units_sold}</p>
                </div>
              </div>

              {/* Tax toggles */}
              <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`vat-${item.id}`}
                    checked={flags.vat}
                    onCheckedChange={() => toggleFlag(item.id, "vat")}
                    className="scale-75"
                  />
                  <Label htmlFor={`vat-${item.id}`} className="text-[10px] text-muted-foreground cursor-pointer">
                    VAT
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`plt-${item.id}`}
                    checked={flags.plt}
                    onCheckedChange={() => toggleFlag(item.id, "plt")}
                    className="scale-75"
                  />
                  <Label htmlFor={`plt-${item.id}`} className="text-[10px] text-muted-foreground cursor-pointer">
                    PLT
                  </Label>
                </div>
              </div>

              {/* Tax breakdown */}
              {(flags.vat || flags.plt) && (
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  {flags.vat && (
                    <div>
                      <p className="text-muted-foreground">VAT</p>
                      <p className="font-semibold text-primary">{fmtUSD(tax.vat)}</p>
                    </div>
                  )}
                  {flags.plt && (
                    <div>
                      <p className="text-muted-foreground">PLT</p>
                      <p className="font-semibold text-warning">{fmtUSD(tax.plt)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">w/ Tax</p>
                    <p className="font-semibold text-foreground">{fmtUSD(tax.grandTotal)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-[10px] text-muted-foreground">Revenue</span>
                <span className="text-sm font-bold text-foreground">${item.revenue.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
