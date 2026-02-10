import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  parseSalesCSV,
  parseBankStatementCSV,
  parseInventoryCSV,
  parseIncomeStatement,
  type SalesRecord,
  type BankStatementRecord,
  type InventoryRecord,
  type IncomeStatement,
} from "@/lib/csv-parser";

interface RealData {
  sales: SalesRecord[];
  bank: BankStatementRecord[];
  inventory: InventoryRecord[];
  income: IncomeStatement | null;
  loading: boolean;
  error: string | null;
}

const RealDataContext = createContext<RealData>({
  sales: [],
  bank: [],
  inventory: [],
  income: null,
  loading: true,
  error: null,
});

export function useRealData() {
  return useContext(RealDataContext);
}

const CSV_PATHS = {
  sales: "/data/sales-dec-2025.csv",
  bank: "/data/bank-statement-exp-dec-2025.csv",
  inventory: "/data/inventory-dec-2025.tsv",
  income: "/data/income-statement-dec-2025.csv",
};

export function RealDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Omit<RealData, "loading" | "error">>({
    sales: [],
    bank: [],
    inventory: [],
    income: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const [salesText, bankText, inventoryText, incomeText] = await Promise.all(
          Object.values(CSV_PATHS).map((p) => fetch(p).then((r) => r.text()))
        );

        if (cancelled) return;

        setData({
          sales: parseSalesCSV(salesText),
          bank: parseBankStatementCSV(bankText),
          inventory: parseInventoryCSV(inventoryText),
          income: parseIncomeStatement(incomeText),
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load CSV data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, []);

  return (
    <RealDataContext.Provider value={{ ...data, loading, error }}>
      {children}
    </RealDataContext.Provider>
  );
}
