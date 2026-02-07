import { useState, useMemo, useCallback, useTransition } from "react";
import { mockDailySales, mockBills, mockBankTransactions } from "@/lib/mock-data";
import type { DailySales } from "@/lib/mock-data";

export type PeriodMode = "daily" | "weekly" | "monthly" | "custom";

// Map mock short dates to real Date objects (using 2025 as mock year)
const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseShortDate(d: string): Date {
  const [mon, day] = d.split(" ");
  return new Date(2025, MONTH_MAP[mon] ?? 0, parseInt(day, 10));
}

export interface PeriodStats {
  filteredSales: DailySales[];
  totalSales: number;
  totalDeposits: number;
  matchedCount: number;
  totalBills: number;
  discrepancy: number;
  reconciliationPct: number;
}

export function usePeriodData() {
  const [mode, setMode] = useState<PeriodMode>("weekly");
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const [isPending, startTransition] = useTransition();

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
    const allDates = mockDailySales.map((s) => parseShortDate(s.date));
    const latest = new Date(Math.max(...allDates.map((d) => d.getTime())));

    let from: Date;
    let to: Date = latest;

    switch (mode) {
      case "daily":
        from = latest;
        break;
      case "weekly":
        from = new Date(latest);
        from.setDate(from.getDate() - 6);
        break;
      case "monthly":
        from = new Date(latest);
        from.setDate(from.getDate() - 29);
        break;
      case "custom":
        if (customRange) {
          from = customRange.from;
          to = customRange.to;
        } else {
          from = latest;
        }
        break;
    }

    const filtered = mockDailySales.filter((s) => {
      const d = parseShortDate(s.date);
      return d >= from && d <= to;
    });

    const totalSales = filtered.reduce((s, r) => s + r.sales, 0);
    const totalDeposits = filtered.reduce((s, r) => s + r.deposits, 0);
    const discrepancy = totalSales - totalDeposits;

    // Reconciliation from bills data
    const matchedCount = mockBills.filter((b) => b.aba_status === "Matched").length;
    const totalBills = mockBills.length;
    const reconciliationPct = totalBills > 0 ? (matchedCount / totalBills) * 100 : 0;

    return {
      filteredSales: filtered,
      totalSales,
      totalDeposits,
      matchedCount,
      totalBills,
      discrepancy,
      reconciliationPct,
    };
  }, [mode, customRange]);

  return { mode, changeMode, customRange, changeCustomRange, stats, isPending };
}
