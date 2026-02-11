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
import { parsePurchasesCSV, type PurchaseRecord } from "@/lib/purchases-parser";

interface RealData {
  sales: SalesRecord[];
  bank: BankStatementRecord[];
  bankSales: BankStatementRecord[];
  inventory: InventoryRecord[];
  income: IncomeStatement | null;
  purchases: PurchaseRecord[];
  loading: boolean;
  error: string | null;
}

const RealDataContext = createContext<RealData>({
  sales: [],
  bank: [],
  bankSales: [],
  inventory: [],
  income: null,
  purchases: [],
  loading: true,
  error: null,
});

export function useRealData() {
  return useContext(RealDataContext);
}

const CSV_PATHS = {
  sales: "/data/sales-dec-2025.csv",
  bank: "/data/bank-statement-exp-dec-2025.csv",
  bankSales: "/data/bank-statement-dec-2025.csv",
  inventory: "/data/inventory-dec-2025.tsv",
  income: "/data/income-statement-dec-2025.csv",
  purchases: "/data/purchases-dec-2025.csv",
};

export function RealDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Omit<RealData, "loading" | "error">>({
    sales: [],
    bank: [],
    bankSales: [],
    inventory: [],
    income: null,
    purchases: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const [salesText, bankText, bankSalesText, inventoryText, incomeText, purchasesText] = await Promise.all(
          Object.values(CSV_PATHS).map((p) => fetch(p).then((r) => r.text()))
        );

        if (cancelled) return;

        setData({
          sales: parseSalesCSV(salesText),
          bank: parseBankStatementCSV(bankText),
          bankSales: parseBankStatementCSV(bankSalesText),
          inventory: parseInventoryCSV(inventoryText),
          income: parseIncomeStatement(incomeText),
          purchases: parsePurchasesCSV(purchasesText),
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
