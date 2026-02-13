import { createContext, useContext, useState, useMemo, useCallback, useTransition, type ReactNode } from "react";
import { useRealData } from "@/contexts/RealDataContext";

export type PeriodMode = "daily" | "weekly" | "monthly" | "custom";

export interface PeriodStats {
  filteredSales: { date: string; sales: number; deposits: number }[];
  filteredBills: unknown[];
  totalSales: number;
  totalDeposits: number;
  matchedCount: number;
  totalBills: number;
  discrepancy: number;
  reconciliationPct: number;
}

interface PeriodContextValue {
  mode: PeriodMode;
  changeMode: (m: PeriodMode) => void;
  customRange: { from: Date; to: Date } | null;
  changeCustomRange: (from: Date, to: Date) => void;
  stats: PeriodStats;
  isPending: boolean;
  periodLabel: string;
}

const PeriodContext = createContext<PeriodContextValue | null>(null);

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod must be used within PeriodProvider");
  return ctx;
}

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PeriodMode>("monthly");
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { sales, bank, income } = useRealData();

  const changeMode = useCallback((m: PeriodMode) => {
    startTransition(() => setMode(m));
  }, []);

  const changeCustomRange = useCallback((from: Date, to: Date) => {
    startTransition(() => {
      setCustomRange({ from, to });
      setMode("custom");
    });
  }, []);

  const stats = useMemo<PeriodStats>(() => {
    // Derive from real CSV data
    const totalSales = sales.reduce((s, r) => s + r.total_sales, 0);
    const totalDeposits = bank.reduce((s, r) => s + r.money_in, 0);
    const discrepancy = totalSales - totalDeposits;

    const bankTxnCount = bank.length;
    const depositCount = bank.filter((r) => r.money_in > 0).length;

    return {
      filteredSales: [{ date: "Dec 2025", sales: totalSales, deposits: totalDeposits }],
      filteredBills: [],
      totalSales,
      totalDeposits,
      matchedCount: depositCount,
      totalBills: bankTxnCount,
      discrepancy,
      reconciliationPct: bankTxnCount > 0 ? (depositCount / bankTxnCount) * 100 : 0,
    };
  }, [sales, bank, mode, customRange]);

  const periodLabel = useMemo(() => {
    if (mode === "custom" && customRange) {
      const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${fmt(customRange.from)} – ${fmt(customRange.to)}`;
    }
    if (mode === "daily") return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    if (mode === "weekly") return "This Week";
    return "All Periods";
  }, [mode, customRange]);

  return (
    <PeriodContext.Provider value={{ mode, changeMode, customRange, changeCustomRange, stats, isPending, periodLabel }}>
      {children}
    </PeriodContext.Provider>
  );
}
