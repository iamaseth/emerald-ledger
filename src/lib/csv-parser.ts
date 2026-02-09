// Generic CSV parsing engine with specific parsers for each report type.

export interface ParsedCSVRow {
  [key: string]: string;
}

/**
 * Parse raw CSV text into an array of string arrays (rows × columns).
 */
export function parseCSVRaw(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());
    return cols;
  });
}

/**
 * Parse CSV text with a header row into keyed objects.
 */
export function parseCSVWithHeaders(text: string): ParsedCSVRow[] {
  const rows = parseCSVRaw(text);
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((cols) => {
    const obj: ParsedCSVRow = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ?? "";
    });
    return obj;
  });
}

// ─── Helpers ────────────────────────────────────────────────

/** Clean accounting-format numbers: "(1,234)" → -1234, "1,234" → 1234 */
export function parseAccountingNumber(raw: string): number {
  if (!raw || raw.trim() === "-" || raw.trim() === "") return 0;
  let cleaned = raw.replace(/\s/g, "").replace(/,/g, "");
  let negative = false;
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    negative = true;
    cleaned = cleaned.slice(1, -1);
  }
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return negative ? -num : num;
}

// ─── Income Statement Parser ────────────────────────────────

export interface IncomeStatementLine {
  category: string;
  amount: number;
  percentage: number | null;
  note: string;
}

export interface IncomeStatement {
  period: string;
  revenue: number;
  expenses: IncomeStatementLine[];
  totalExpense: number;
  grossProfit: number;
  profitShares: { name: string; amount: number }[];
}

export function parseIncomeStatement(text: string): IncomeStatement {
  const rows = parseCSVRaw(text);

  let period = "";
  let revenue = 0;
  let totalExpense = 0;
  let grossProfit = 0;
  const expenses: IncomeStatementLine[] = [];
  const profitShares: { name: string; amount: number }[] = [];
  let pastRevenue = false;
  let pastTotalExpense = false;

  for (const cols of rows) {
    const label = (cols[0] ?? "").trim();
    const amountRaw = cols[1] ?? "";
    const pctRaw = cols[2] ?? "";
    const noteRaw = cols[3] ?? "";

    // Period header (date row)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(label)) {
      period = label;
      continue;
    }

    if (label === "Income Statement") continue;
    if (label === "" && amountRaw === "") continue;

    const amount = parseAccountingNumber(amountRaw);

    if (label === "Revenue") {
      revenue = amount;
      pastRevenue = true;
      continue;
    }

    if (label === "Total Expense") {
      totalExpense = Math.abs(amount);
      pastTotalExpense = true;
      continue;
    }

    if (label.startsWith("Gross profit")) {
      grossProfit = amount;
      continue;
    }

    if (label.startsWith("Profit share")) {
      profitShares.push({ name: label.replace("Profit share-", ""), amount });
      continue;
    }

    // Expense lines (between Revenue and Total Expense)
    if (pastRevenue && !pastTotalExpense && label) {
      const pct = pctRaw ? parseFloat(pctRaw.replace("%", "")) : null;
      expenses.push({
        category: label,
        amount: Math.abs(amount),
        percentage: pct,
        note: noteRaw,
      });
    }
  }

  return { period, revenue, expenses, totalExpense, grossProfit, profitShares };
}

// ─── Sales CSV Parser (placeholder for when file is uploaded) ────

export interface SalesRecord {
  bill_id: string;
  date: string;
  category: string;
  total_sales: number;
  discount: number;
  bill_discount: number;
  net_revenue: number;
}

export function parseSalesCSV(text: string): SalesRecord[] {
  const rows = parseCSVWithHeaders(text);
  return rows.map((r) => {
    const totalSales = parseAccountingNumber(r["Total Sales"] || r["Total"] || "0");
    const discount = parseAccountingNumber(r["Discount"] || "0");
    const billDiscount = parseAccountingNumber(r["Bill Discount"] || "0");
    return {
      bill_id: r["Bill ID"] || r["Bill No"] || r["No"] || "",
      date: r["Date"] || "",
      category: r["Category"] || "",
      total_sales: totalSales,
      discount: Math.abs(discount),
      bill_discount: Math.abs(billDiscount),
      net_revenue: totalSales - Math.abs(discount) - Math.abs(billDiscount),
    };
  });
}

// ─── Bank Statement Parser (placeholder) ────────────────────

export interface BankStatementRecord {
  date: string;
  transaction_details: string;
  money_in: number;
  money_out: number;
  remark: string;
  matched_bill_id: string | null;
}

export function parseBankStatementCSV(text: string): BankStatementRecord[] {
  const rows = parseCSVWithHeaders(text);
  return rows.map((r) => {
    const remark = r["Remark"] || r["Description"] || "";
    // Try to extract bill ID from remark text
    const billMatch = remark.match(/(?:Bill|B|#)\s*(\d+)/i);
    return {
      date: r["Date"] || r["Transaction Date"] || "",
      transaction_details: r["Transaction Details"] || r["Details"] || "",
      money_in: parseAccountingNumber(r["Money In"] || r["Credit"] || "0"),
      money_out: parseAccountingNumber(r["Money Out"] || r["Debit"] || "0"),
      remark,
      matched_bill_id: billMatch ? billMatch[1] : null,
    };
  });
}

// ─── Inventory CSV Parser (placeholder) ─────────────────────

export interface InventoryRecord {
  item_name: string;
  category: string;
  unit: string;
  system_qty: number;
  physical_qty: number;
  lost_qty: number;
  cog: number;
  loss_value: number;
}

export function parseInventoryCSV(text: string): InventoryRecord[] {
  const rows = parseCSVWithHeaders(text);
  return rows.map((r) => {
    const systemQty = parseAccountingNumber(r["System QTY"] || r["System Qty"] || "0");
    const physicalQty = parseAccountingNumber(r["Physical QTY"] || r["Physical Qty"] || "0");
    const lostQty = physicalQty - systemQty;
    const cog = parseAccountingNumber(r["COG"] || r["Cost"] || r["Unit Cost"] || "0");
    return {
      item_name: r["Item"] || r["Item Name"] || r["Name"] || "",
      category: r["Category"] || "",
      unit: r["Unit"] || "",
      system_qty: systemQty,
      physical_qty: physicalQty,
      lost_qty: lostQty,
      cog,
      loss_value: Math.abs(lostQty) * cog,
    };
  });
}
