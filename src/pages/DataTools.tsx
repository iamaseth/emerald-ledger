import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Landmark,
  Warehouse,
  BarChart3,
} from "lucide-react";
import {
  parseSalesCSV,
  parseBankStatementCSV,
  parseInventoryCSV,
  parseIncomeStatement,
} from "@/lib/csv-parser";

type ImportType = "sales" | "bank" | "inventory" | "income";

interface ImportConfig {
  type: ImportType;
  title: string;
  description: string;
  icon: typeof DollarSign;
  accept: string;
  iconClass: string;
  bgClass: string;
}

const importConfigs: ImportConfig[] = [
  {
    type: "sales",
    title: "Sales Report",
    description: "MobiPOS Item Sales Report — maps Category, Item Name, Price, Discount & Bill Discount to calculate Net Revenue per item.",
    icon: DollarSign,
    accept: ".csv",
    iconClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  {
    type: "bank",
    title: "Bank Statement",
    description: "ABA bank statement — parses Transaction Details, Money In/Out, and extracts Remark text for expense tracking.",
    icon: Landmark,
    accept: ".csv",
    iconClass: "text-info",
    bgClass: "bg-info/10",
  },
  {
    type: "inventory",
    title: "Inventory Count",
    description: "Stock count sheet (TSV/CSV) — calculates Lost stock (Physical − System QTY) and dollar value using COG.",
    icon: Warehouse,
    accept: ".csv,.tsv,.txt",
    iconClass: "text-warning",
    bgClass: "bg-warning/10",
  },
  {
    type: "income",
    title: "Income Statement",
    description: "P&L master list — parses expense categories for the Profit & Loss dashboard.",
    icon: BarChart3,
    accept: ".csv",
    iconClass: "text-success",
    bgClass: "bg-success/10",
  },
];

interface ImportResult {
  type: ImportType;
  fileName: string;
  recordCount: number;
  status: "success" | "error";
  message: string;
  timestamp: Date;
}

export default function DataTools() {
  const [results, setResults] = useState<ImportResult[]>([]);
  const [processing, setProcessing] = useState<ImportType | null>(null);

  const handleFileUpload = useCallback(
    async (type: ImportType, file: File) => {
      setProcessing(type);
      try {
        const text = await file.text();
        let recordCount = 0;
        let message = "";

        switch (type) {
          case "sales": {
            const records = parseSalesCSV(text);
            recordCount = records.length;
            const totalRevenue = records.reduce((s, r) => s + r.net_revenue, 0);
            const totalSales = records.reduce((s, r) => s + r.total_sales, 0);
            const totalDiscount = records.reduce((s, r) => s + r.discount + r.bill_discount, 0);
            const categories = new Set(records.map((r) => r.category));
            message = `${recordCount} items across ${categories.size} categories. Total Sales: $${totalSales.toLocaleString(undefined, {minimumFractionDigits: 2})}. Discounts: $${totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}. Net Revenue: $${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}.`;
            break;
          }
          case "bank": {
            const records = parseBankStatementCSV(text);
            recordCount = records.length;
            const totalIn = records.reduce((s, r) => s + r.money_in, 0);
            const totalOut = records.reduce((s, r) => s + r.money_out, 0);
            message = `${recordCount} transactions. Money In: $${totalIn.toLocaleString(undefined, {minimumFractionDigits: 2})}. Money Out: $${totalOut.toLocaleString(undefined, {minimumFractionDigits: 2})}.`;
            break;
          }
          case "inventory": {
            const records = parseInventoryCSV(text);
            recordCount = records.length;
            const totalLoss = records.reduce((s, r) => s + Math.abs(r.lost_value), 0);
            const totalCog = records.reduce((s, r) => s + Math.abs(r.total_cog), 0);
            const lostItems = records.filter((r) => r.diff !== 0).length;
            message = `${recordCount} items tracked. ${lostItems} with stock discrepancy. Total loss: $${totalLoss.toLocaleString(undefined, {minimumFractionDigits: 2})}. Total COG: $${totalCog.toLocaleString(undefined, {minimumFractionDigits: 2})}.`;
            break;
          }
          case "income": {
            const parsed = parseIncomeStatement(text);
            recordCount = parsed.expenses.length;
            message = `Revenue: $${parsed.revenue.toLocaleString()}. ${recordCount} expense categories. Gross Profit: $${parsed.grossProfit.toLocaleString()}.`;
            break;
          }
        }

        setResults((prev) => [
          { type, fileName: file.name, recordCount, status: "success", message, timestamp: new Date() },
          ...prev,
        ]);
      } catch (e) {
        setResults((prev) => [
          { type, fileName: file.name, recordCount: 0, status: "error", message: e instanceof Error ? e.message : "Parse failed", timestamp: new Date() },
          ...prev,
        ]);
      } finally {
        setProcessing(null);
      }
    },
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Data Processing Tools</h1>
        <p className="text-sm text-muted-foreground">
          Import CSV reports to update dashboards with real business data
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {importConfigs.map((cfg) => {
          const Icon = cfg.icon;
          const isProcessing = processing === cfg.type;
          return (
            <div key={cfg.type} className="glass-card p-5 flex flex-col gap-4 transition-all hover:glow-primary">
              <div className="flex items-start gap-3">
                <div className={cn("rounded-lg p-2.5", cfg.bgClass)}>
                  <Icon className={cn("h-5 w-5", cfg.iconClass)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{cfg.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cfg.description}</p>
                </div>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept={cfg.accept}
                  className="hidden"
                  disabled={isProcessing}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(cfg.type, file);
                    e.target.value = "";
                  }}
                />
                <Button variant="outline" size="sm" className="w-full gap-2 pointer-events-none" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Upload {cfg.accept.includes(".tsv") ? "CSV / TSV" : "CSV"}
                    </>
                  )}
                </Button>
              </label>
            </div>
          );
        })}
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Import Results</h2>
          {results.map((r, i) => {
            const cfg = importConfigs.find((c) => c.type === r.type)!;
            const Icon = cfg.icon;
            return (
              <div
                key={`${r.type}-${i}`}
                className={cn("glass-card p-4 flex items-start gap-3", r.status === "error" && "border-destructive/30")}
              >
                <div className={cn("rounded-lg p-2 shrink-0", cfg.bgClass)}>
                  <Icon className={cn("h-4 w-4", cfg.iconClass)} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{cfg.title}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        r.status === "success"
                          ? "bg-success/15 text-success border-success/30"
                          : "bg-destructive/15 text-destructive border-destructive/30"
                      )}
                    >
                      {r.status === "success" ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                      {r.status === "success" ? `${r.recordCount} records` : "Error"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <FileSpreadsheet className="h-3 w-3 inline mr-1" />
                    {r.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.message}</p>
                  <p className="text-[10px] text-muted-foreground/60">{r.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
