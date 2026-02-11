import { parseCSVRaw, parseAccountingNumber } from "./csv-parser";

export interface PurchaseRecord {
  date: string;
  remark: string;
  amount: number;
}

export function parsePurchasesCSV(text: string): PurchaseRecord[] {
  const rows = parseCSVRaw(text);
  const records: PurchaseRecord[] = [];

  // Find header row with "Date" and "Remark"
  let dataStart = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map((c) => c.trim().toLowerCase());
    if (row.includes("date") && row.includes("remark")) {
      dataStart = i + 1;
      break;
    }
  }
  if (dataStart < 0) {
    // Fallback: skip first row (date header), start from row index 1
    dataStart = 1;
  }

  for (let i = dataStart; i < rows.length; i++) {
    const cols = rows[i];
    const date = (cols[0] ?? "").trim();
    const remark = (cols[1] ?? "").trim();
    const amount = parseAccountingNumber(cols[2] ?? "0");

    if (!date || !remark || amount === 0) continue;

    records.push({ date, remark, amount });
  }

  return records;
}
