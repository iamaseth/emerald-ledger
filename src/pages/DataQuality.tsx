import { useMemo } from "react";
import { useRealData } from "@/contexts/RealDataContext";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  AlertTriangle,
  Search,
  PackageX,
  TrendingDown,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";

// ─── Income Statement categories (canonical list) ───────────
const INCOME_CATEGORIES = [
  "Cost of Beer and liquer", "Cigareet expense", "Cigarrete expense", "Cigarret expense",
  "Cleaning expense", "Decoration expense", "Drinking water for staffs",
  "Electricity expense", "Entertainment expense", "Water expense", "Event expenses",
  "Expense with no invoice", "Facilities expense", "Flower expense", "Fruit expense",
  "Gas expense", "Grocery expense", "Ice expense", "Interest expense",
  "Kitchen expense - BSB", "Kitchen Expense - Burger Bun", "Kitchen expense - LSH",
  "Kitchen Expense - Pepperoni", "Kitchen expense - Salmon", "Kitchen - Cheese",
  "Kitchen - Other", "Kitchen- Miscellaneous expense", "Maintenance expense",
  "Marketing expense", "Miscellaneous expenses", "Monthly Tax expense",
  "Music system rental expense", "Officer expense", "Office Supply expense",
  "Other expense", "Casual worker", "Transportation expense", "Rental Expense",
  "Internet Expense", "POS service", "Payroll Expense", "Payroll-Overtime",
];

const NORM_CATEGORIES = INCOME_CATEGORIES.map((c) => c.toLowerCase().replace(/[\s-]+/g, " ").trim());

function normalizeCategory(s: string) {
  return s.toLowerCase().replace(/[\s-]+/g, " ").trim();
}

function matchesIncomeCategory(remark: string): boolean {
  const norm = normalizeCategory(remark);
  return NORM_CATEGORIES.some((c) => norm === c || norm.includes(c) || c.includes(norm));
}

export default function DataQuality() {
  const { sales, bankSales, inventory, purchases, income, loading } = useRealData();

  // ─── 1. DATA QUALITY SCORE ───────────────────────────────
  const zeroCostItems = useMemo(() => {
    return sales.filter((s) => s.cost === 0 && s.total_sales > 0);
  }, [sales]);

  // Match zero-cost items to inventory to find COG
  const zeroCostWithCOG = useMemo(() => {
    return zeroCostItems.map((item) => {
      const invMatch = inventory.find(
        (inv) =>
          inv.item_name.toLowerCase() === item.item_name.toLowerCase() ||
          inv.item_name.toLowerCase().includes(item.item_name.toLowerCase()) ||
          item.item_name.toLowerCase().includes(inv.item_name.toLowerCase())
      );
      return {
        ...item,
        inventoryCOG: invMatch?.cog ?? 0,
        inventoryName: invMatch?.item_name ?? null,
      };
    });
  }, [zeroCostItems, inventory]);

  // Uncategorized purchases
  const uncategorizedPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const r = p.remark;
      if (r.toLowerCase().startsWith("internal") || r.toLowerCase().startsWith("wrong") || r.toLowerCase().startsWith("asset") || r.toLowerCase().startsWith("profit share")) return false;
      return !matchesIncomeCategory(r);
    });
  }, [purchases]);

  // Health Score: penalize zero-cost items and uncategorized expenses
  const healthScore = useMemo(() => {
    const totalItems = sales.filter((s) => s.total_sales > 0).length;
    const costPenalty = totalItems > 0 ? (zeroCostItems.length / totalItems) * 40 : 0;
    const totalPurchases = purchases.filter(p => !p.remark.toLowerCase().startsWith("internal") && !p.remark.toLowerCase().startsWith("wrong") && !p.remark.toLowerCase().startsWith("asset") && !p.remark.toLowerCase().startsWith("profit share")).length;
    const catPenalty = totalPurchases > 0 ? (uncategorizedPurchases.length / totalPurchases) * 30 : 0;
    // Inventory completeness
    const invItems = inventory.filter((i) => i.diff !== 0).length;
    const invPenalty = inventory.length > 0 ? (invItems / inventory.length) * 30 : 0;
    return Math.max(0, Math.round(100 - costPenalty - catPenalty - invPenalty));
  }, [sales, zeroCostItems, purchases, uncategorizedPurchases, inventory]);

  // ─── 2. MISSING LINK FINDER ──────────────────────────────
  const bankRefs = useMemo(() => {
    return bankSales.map((b) => {
      const refMatch = b.transaction_details.match(/REF#\s*(\S+)/i);
      return {
        ...b,
        ref: refMatch ? refMatch[1] : null,
      };
    });
  }, [bankSales]);

  // POS payments (money_in > 0) from bank
  const bankPayments = useMemo(() => bankRefs.filter((b) => b.money_in > 0), [bankRefs]);
  const bankExpenses = useMemo(() => bankRefs.filter((b) => b.money_out > 0), [bankRefs]);

  // Total POS sales vs total bank incoming
  const totalPOSSales = useMemo(() => sales.reduce((s, r) => s + r.total_sales, 0), [sales]);
  const totalBankIn = useMemo(() => bankPayments.reduce((s, r) => s + r.money_in, 0), [bankPayments]);
  const totalBankOut = useMemo(() => bankExpenses.reduce((s, r) => s + r.money_out, 0), [bankExpenses]);
  const discrepancy = totalPOSSales - totalBankIn;

  // ─── 3. INVENTORY LEAK DETECTOR ──────────────────────────
  const inventoryLeaks = useMemo(() => {
    return inventory
      .filter((i) => i.diff < 0)
      .map((i) => ({
        ...i,
        // Total COG captures both consumption and lost value
        totalLoss: Math.abs(i.total_cog),
      }))
      .sort((a, b) => b.totalLoss - a.totalLoss);
  }, [inventory]);

  const totalValueAtRisk = useMemo(
    () => inventoryLeaks.reduce((s, i) => s + i.totalLoss, 0),
    [inventoryLeaks]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const scoreColor =
    healthScore >= 80 ? "text-success" : healthScore >= 60 ? "text-warning" : "text-destructive";
  const scoreBg =
    healthScore >= 80 ? "bg-success/15" : healthScore >= 60 ? "bg-warning/15" : "bg-destructive/15";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Data Onboarding & Quality</h1>
        <p className="text-sm text-muted-foreground">
          Automated data integrity analysis — All Periods
        </p>
      </div>

      {/* ─── Summary Cards ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cn("glass-card p-5", scoreBg)}>
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className={cn("h-5 w-5", scoreColor)} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Health Score
            </span>
          </div>
          <div className={cn("text-3xl font-bold", scoreColor)}>{healthScore}%</div>
          <Progress value={healthScore} className="mt-3 h-2" />
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Zero-Cost Items
            </span>
          </div>
          <div className="text-3xl font-bold text-warning">{zeroCostItems.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            of {sales.filter((s) => s.total_sales > 0).length} selling items
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Search className="h-5 w-5 text-info" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              POS vs Bank Gap
            </span>
          </div>
          <div className={cn("text-3xl font-bold", discrepancy > 0 ? "text-warning" : "text-success")}>
            ${Math.abs(discrepancy).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {discrepancy > 0 ? "Unverified in bank" : "Bank exceeds POS"}
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <PackageX className="h-5 w-5 text-destructive" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inventory Loss
            </span>
          </div>
          <div className="text-3xl font-bold text-destructive">
            ${totalValueAtRisk.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {inventoryLeaks.length} items with shortages
          </p>
        </div>
      </div>

      {/* ─── Section 1: Zero-Cost Items ────────────────── */}
      <section className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h2 className="text-sm font-bold text-foreground">
            Zero-Cost Items — Missing COGS
          </h2>
          <Badge variant="outline" className="text-[10px] bg-warning/15 text-warning border-warning/30 ml-auto">
            HIGH PRIORITY
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Sale items with $0 cost recorded. Matched against Inventory COG where possible.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 pr-4 font-medium">Item Name</th>
                <th className="pb-2 pr-4 font-medium text-right">Qty Sold</th>
                <th className="pb-2 pr-4 font-medium text-right">Total Sales</th>
                <th className="pb-2 pr-4 font-medium text-right">Inv. COG</th>
                <th className="pb-2 font-medium">Match</th>
              </tr>
            </thead>
            <tbody>
              {zeroCostWithCOG.slice(0, 50).map((item, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 pr-4 text-muted-foreground">{item.category}</td>
                  <td className="py-2 pr-4 font-medium text-foreground">{item.item_name}</td>
                  <td className="py-2 pr-4 text-right">{item.qty}</td>
                  <td className="py-2 pr-4 text-right">${item.total_sales.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-right">
                    {item.inventoryCOG > 0 ? (
                      <span className="text-success">${item.inventoryCOG.toFixed(2)}</span>
                    ) : (
                      <span className="text-destructive">—</span>
                    )}
                  </td>
                  <td className="py-2">
                    {item.inventoryName ? (
                      <CheckCircle className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Section 1b: Uncategorized Purchases ──────── */}
      {uncategorizedPurchases.length > 0 && (
        <section className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-bold text-foreground">
              Uncategorized Expenses
            </h2>
            <Badge variant="outline" className="text-[10px] bg-warning/15 text-warning border-warning/30 ml-auto">
              {uncategorizedPurchases.length} FLAGGED
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Purchase entries that don't match any Income Statement category.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Description</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {uncategorizedPurchases.map((p, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 pr-4 text-muted-foreground">{p.date}</td>
                    <td className="py-2 pr-4 font-medium text-foreground">{p.remark}</td>
                    <td className="py-2 text-right">${p.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─── Section 2: Missing Link Finder ────────────── */}
      <section className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-info" />
          <h2 className="text-sm font-bold text-foreground">
            Missing Link Finder — POS vs Bank Reconciliation
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">POS Total Sales</p>
            <p className="text-lg font-bold text-foreground">
              ${totalPOSSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bank Money In</p>
            <p className="text-lg font-bold text-success">
              ${totalBankIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Discrepancy</p>
            <p className={cn("text-lg font-bold", discrepancy > 500 ? "text-destructive" : discrepancy > 0 ? "text-warning" : "text-success")}>
              ${discrepancy.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bank Payments (In)</p>
            <p className="text-sm text-foreground">{bankPayments.length} transactions</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bank Expenses (Out)</p>
            <p className="text-sm text-foreground">
              {bankExpenses.length} transactions — ${totalBankOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          REF# extracted from {bankRefs.filter((b) => b.ref).length} of {bankRefs.length} bank entries via regex.
        </p>
      </section>

      {/* ─── Section 3: Inventory Leak Detector ─────────── */}
      <section className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-destructive" />
          <h2 className="text-sm font-bold text-foreground">
            Inventory Leak Detector — Value at Risk
          </h2>
          <Badge variant="outline" className="text-[10px] bg-destructive/15 text-destructive border-destructive/30 ml-auto">
            ${totalValueAtRisk.toLocaleString(undefined, { minimumFractionDigits: 2 })} TOTAL LOSS
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Items where Physical QTY &lt; System QTY. Loss = |Diff| × COG.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Item</th>
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 pr-4 font-medium text-right">System</th>
                <th className="pb-2 pr-4 font-medium text-right">Physical</th>
                <th className="pb-2 pr-4 font-medium text-right">Diff</th>
                <th className="pb-2 pr-4 font-medium text-right">COG</th>
                <th className="pb-2 pr-4 font-medium text-right">Total COG Loss</th>
                <th className="pb-2 font-medium">Remark</th>
              </tr>
            </thead>
            <tbody>
              {inventoryLeaks.slice(0, 40).map((item, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/30",
                    item.totalLoss > 100 && "bg-destructive/5"
                  )}
                >
                  <td className="py-2 pr-4 font-medium text-foreground">{item.item_name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{item.category}</td>
                  <td className="py-2 pr-4 text-right">{item.system_qty}</td>
                  <td className="py-2 pr-4 text-right">{item.physical_qty}</td>
                  <td className="py-2 pr-4 text-right text-destructive font-medium">{item.diff}</td>
                  <td className="py-2 pr-4 text-right">
                    {item.cog > 0 ? `$${item.cog.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-2 pr-4 text-right text-destructive font-bold">
                    ${item.totalLoss.toFixed(2)}
                  </td>
                  <td className="py-2 text-muted-foreground truncate max-w-[150px]">{item.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
