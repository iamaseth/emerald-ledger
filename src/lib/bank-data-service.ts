/**
 * Bank Data Service — API-ready abstraction layer.
 * Currently reads from CSV files. To switch to an API, replace the
 * `fetchBankRecords` function body with an HTTP call.
 */

import { parseBankStatementCSV, type BankStatementRecord } from "./csv-parser";

export interface BankDataSource {
  /** Unique key for this source */
  key: string;
  /** Human-friendly label */
  label: string;
  /** URL or API endpoint */
  endpoint: string;
  /** "csv" today, "api" in the future */
  type: "csv" | "api";
}

const DEFAULT_SOURCES: BankDataSource[] = [
  { key: "sales", label: "ABA Sales Deposits", endpoint: "/data/bank-statement-dec-2025.csv", type: "csv" },
  { key: "expenses", label: "ABA Expenses", endpoint: "/data/bank-statement-exp-dec-2025.csv", type: "csv" },
];

/**
 * Fetch bank records from a source. When `type` is `"api"`, expects JSON.
 */
export async function fetchBankRecords(source: BankDataSource): Promise<BankStatementRecord[]> {
  const res = await fetch(source.endpoint);
  if (!res.ok) throw new Error(`Failed to load bank data from ${source.endpoint}: ${res.status}`);

  if (source.type === "api") {
    // Future: return res.json() directly (after mapping to BankStatementRecord[])
    const json = await res.json();
    return json as BankStatementRecord[];
  }

  const text = await res.text();
  return parseBankStatementCSV(text);
}

/**
 * Fetch all configured bank sources in parallel.
 */
export async function fetchAllBankData(): Promise<{
  sales: BankStatementRecord[];
  expenses: BankStatementRecord[];
}> {
  const [sales, expenses] = await Promise.all(
    DEFAULT_SOURCES.map(fetchBankRecords)
  );
  return { sales, expenses };
}

export { DEFAULT_SOURCES };
