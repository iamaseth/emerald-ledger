import { useState, useEffect } from "react";
import { parseIncomeStatement, type IncomeStatement } from "@/lib/csv-parser";

const DEFAULT_CSV_PATH = "/data/income-statement-dec-2025.csv";

export function useIncomeStatement(csvPath: string = DEFAULT_CSV_PATH) {
  const [data, setData] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(csvPath);
        if (!res.ok) throw new Error(`Failed to load CSV: ${res.status}`);
        const text = await res.text();
        const parsed = parseIncomeStatement(text);
        if (!cancelled) setData(parsed);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to parse CSV");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [csvPath]);

  return { data, loading, error };
}

/** Parse an uploaded CSV File into IncomeStatement */
export async function parseIncomeStatementFile(file: File): Promise<IncomeStatement> {
  const text = await file.text();
  return parseIncomeStatement(text);
}
