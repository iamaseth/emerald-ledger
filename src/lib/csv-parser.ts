// Generic CSV / TSV parsing engine with specific parsers for each report type.

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
 * Parse TSV text into an array of string arrays (rows × columns).
 */
export function parseTSVRaw(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => line.split("\t").map((c) => c.trim()));
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

/** Clean accounting-format numbers: "(1,234)" → -1234, "1,234" → 1234, "- " → 0 */
export function parseAccountingNumber(raw: string): number {
  if (!raw || raw.trim() === "-" || raw.trim() === "" || raw.trim() === "-   ") return 0;
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

    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(label)) {
      period = label;
      continue;
    }

    if (label === "Income Statement") continue;
    if (label === "" && amountRaw === "") continue;

    const amount = parseAccountingNumber(amountRaw);

    if (label === "Revenue") { revenue = amount; pastRevenue = true; continue; }
    if (label === "Total Expense") { totalExpense = Math.abs(amount); pastTotalExpense = true; continue; }
    if (label.startsWith("Gross profit")) { grossProfit = amount; continue; }
    if (label.startsWith("Profit share")) {
      profitShares.push({ name: label.replace("Profit share-", ""), amount });
      continue;
    }

    if (pastRevenue && !pastTotalExpense && label) {
      const pct = pctRaw ? parseFloat(pctRaw.replace("%", "")) : null;
      expenses.push({ category: label, amount: Math.abs(amount), percentage: pct, note: noteRaw });
    }
  }

  return { period, revenue, expenses, totalExpense, grossProfit, profitShares };
}

// ─── MobiPOS Item Sales Report Parser ───────────────────────
// Format: 6 header rows, then row 8 = column headers
// Columns: (empty), Category, Item Name, Qty, Price, Discount, Bill Discount, Cost, Total Sales, Category Total

export interface SalesRecord {
  category: string;
  item_name: string;
  qty: number;
  price: number;
  discount: number;
  bill_discount: number;
  cost: number;
  total_sales: number;
  net_revenue: number;
}

export function parseSalesCSV(text: string): SalesRecord[] {
  const rows = parseCSVRaw(text);
  const records: SalesRecord[] = [];

  // Find the header row (contains "Category" and "Item Name")
  let dataStart = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map((c) => c.toLowerCase());
    if (row.includes("category") && row.includes("item name")) {
      dataStart = i + 1;
      break;
    }
  }
  if (dataStart < 0) return records;

  for (let i = dataStart; i < rows.length; i++) {
    const cols = rows[i];
    const category = (cols[1] ?? "").trim();
    const itemName = (cols[2] ?? "").trim();

    // Skip empty rows, summary rows (Total Quantity / Sales)
    if (!category || !itemName) continue;
    if (category.toLowerCase().startsWith("total")) continue;

    const qty = parseAccountingNumber(cols[3] ?? "0");
    const price = parseAccountingNumber(cols[4] ?? "0");
    const discount = Math.abs(parseAccountingNumber(cols[5] ?? "0"));
    const billDiscount = Math.abs(parseAccountingNumber(cols[6] ?? "0"));
    const cost = parseAccountingNumber(cols[7] ?? "0");
    const totalSales = parseAccountingNumber(cols[8] ?? "0");

    // Skip zero-sale items
    if (totalSales === 0 && qty === 0) continue;

    records.push({
      category,
      item_name: itemName,
      qty,
      price,
      discount,
      bill_discount: billDiscount,
      cost,
      total_sales: totalSales,
      net_revenue: price - discount - billDiscount,
    });
  }

  return records;
}

// ─── ABA Bank Statement Parser ──────────────────────────────
// Format: Row 1 = "ACCOUNT ACTIVITY", Row 2 = blank, Row 3 = headers
// Columns: Date, Transaction Details, Money In, Ccy, Money Out, Ccy, Balance, Ccy

export interface BankStatementRecord {
  date: string;
  transaction_details: string;
  money_in: number;
  money_out: number;
  currency: string;
  balance: number;
  remark: string;
  matched_bill_id: string | null;
}

export function parseBankStatementCSV(text: string): BankStatementRecord[] {
  const rows = parseCSVRaw(text);
  const records: BankStatementRecord[] = [];

  // Find header row with "Date" and "Transaction Details"
  let dataStart = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].some((c) => c === "Date") && rows[i].some((c) => c === "Transaction Details")) {
      dataStart = i + 1;
      break;
    }
  }
  if (dataStart < 0) return records;

  for (let i = dataStart; i < rows.length; i++) {
    const cols = rows[i];
    const date = (cols[0] ?? "").trim();
    const details = (cols[1] ?? "").trim();

    if (!date || !details) continue;

    const moneyIn = parseAccountingNumber(cols[2] ?? "0");
    const ccy = (cols[3] ?? "USD").trim();
    const moneyOut = parseAccountingNumber(cols[4] ?? "0");
    const balance = parseAccountingNumber(cols[6] ?? "0");

    // Extract remark from transaction details (text after "REMARK:")
    const remarkMatch = details.match(/REMARK:\s*(.+?)(?:\s{2,}|REF#|PURCHASE#|$)/i);
    const remark = remarkMatch ? remarkMatch[1].trim() : "";

    // Try to extract bill ID from remark or details
    const billMatch = details.match(/(?:Bill|B|#)\s*(\d{5,})/i);

    records.push({
      date,
      transaction_details: details,
      money_in: moneyIn,
      money_out: moneyOut,
      currency: ccy || "USD",
      balance,
      remark,
      matched_bill_id: billMatch ? billMatch[1] : null,
    });
  }

  return records;
}

// ─── Inventory TSV Parser ───────────────────────────────────
// Tab-separated. 4 header rows, data from row 5.
// Columns (tab-indexed): 0=marker, 1=category, 2=subcategory, 3=item code,
// 4=display name, 5=UOM, 6=opening QTY, 7=Purchase, 8=Sale,
// 9=Balance QTY, 10=Physical QTY, 11=Diff, 12=COG,
// 13=Consumption, 14=Lost, 15=Total COG, 16=Purchase cost, 17=Remark, 18=Action

export interface InventoryRecord {
  item_name: string;
  category: string;
  unit: string;
  opening_qty: number;
  purchases: number;
  sales: number;
  system_qty: number;
  physical_qty: number;
  diff: number;
  cog: number;
  consumption: number;
  lost_value: number;
  total_cog: number;
  purchase_cost: number;
  remark: string;
  action: string;
}

export function parseInventoryTSV(text: string): InventoryRecord[] {
  const rows = parseTSVRaw(text);
  const records: InventoryRecord[] = [];

  // Skip the first 4 header rows, start at row index 4
  for (let i = 4; i < rows.length; i++) {
    const cols = rows[i];
    const itemName = (cols[4] ?? "").trim();

    // Skip empty or summary rows
    if (!itemName) continue;
    // Skip totals row at end
    if (cols.every((c) => !c || /^[\d.,\s()-]+$/.test(c)) && !itemName) continue;

    const category = (cols[1] ?? "").trim();
    const unit = (cols[5] ?? "").trim();
    const openingQty = parseAccountingNumber(cols[6] ?? "0");
    const purchases = parseAccountingNumber(cols[7] ?? "0");
    const sales = parseAccountingNumber(cols[8] ?? "0");
    const systemQty = parseAccountingNumber(cols[9] ?? "0");
    const physicalQty = parseAccountingNumber(cols[10] ?? "0");
    const diff = parseAccountingNumber(cols[11] ?? "0");
    const cog = parseAccountingNumber(cols[12] ?? "0");
    const consumption = parseAccountingNumber(cols[13] ?? "0");
    const lostValue = parseAccountingNumber(cols[14] ?? "0");
    const totalCog = parseAccountingNumber(cols[15] ?? "0");
    const purchaseCost = parseAccountingNumber(cols[16] ?? "0");
    const remark = (cols[17] ?? "").trim();
    const action = (cols[18] ?? "").trim();

    records.push({
      item_name: itemName,
      category: category || "Uncategorized",
      unit,
      opening_qty: openingQty,
      purchases,
      sales,
      system_qty: systemQty,
      physical_qty: physicalQty,
      diff,
      cog,
      consumption,
      lost_value: lostValue,
      total_cog: totalCog,
      purchase_cost: purchaseCost,
      remark,
      action,
    });
  }

  return records;
}

// Keep the old parseInventoryCSV name as alias for backward compat
export function parseInventoryCSV(text: string): InventoryRecord[] {
  // Auto-detect TSV vs CSV
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  if (firstLine.includes("\t")) {
    return parseInventoryTSV(text);
  }
  // Fallback: try TSV anyway (some CSV exports use tabs)
  return parseInventoryTSV(text);
}
