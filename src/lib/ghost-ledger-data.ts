// Ghost Ledger: Mock POS transactions and bank statement data for development

export interface GhostTransaction {
  id: string;
  billId: string;
  time: string;       // e.g. "8:01 PM"
  dateTime: Date;
  amount: number;
  paymentMethod: "QR" | "Card" | "Cash";
  bankStatus: "matched" | "missing";
  bankRef: string;     // Bank reference number if matched
  bankAmount: number;  // Actual bank deposit amount (may differ for Card)
}

const PAYMENT_METHODS: GhostTransaction["paymentMethod"][] = ["QR", "Card", "Cash"];

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function padTime(h: number, m: number): string {
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function generateBillId(index: number): string {
  return `BL-${(1001 + index).toString()}`;
}

function generateBankRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "ABA-";
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

/**
 * Generate 50 sequential mock POS transactions with bank matching.
 * 40 matched (green), 10 missing (red).
 * Card transactions have bank amount 3% lower to test fee logic.
 */
export function generateGhostData(): GhostTransaction[] {
  // Decide which 10 indices will be "missing"
  const missingIndices = new Set<number>();
  while (missingIndices.size < 10) {
    missingIndices.add(Math.floor(Math.random() * 50));
  }

  const transactions: GhostTransaction[] = [];
  // Start at 11:00 AM, increment by 1-5 minutes
  let currentMinutes = 11 * 60; // minutes from midnight

  for (let i = 0; i < 50; i++) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const time = padTime(h, m);
    const dateTime = new Date(2025, 11, 15, h, m); // Dec 15, 2025

    const amount = randomBetween(2.5, 85);
    const method = PAYMENT_METHODS[Math.floor(Math.random() * 3)];
    const isMissing = missingIndices.has(i);

    let bankAmount = 0;
    let bankRef = "";
    if (!isMissing) {
      bankRef = generateBankRef();
      // Card payments: bank receives 3% less (processing fee)
      bankAmount = method === "Card"
        ? Math.round(amount * 0.97 * 100) / 100
        : amount;
    }

    transactions.push({
      id: `ghost-${i}`,
      billId: generateBillId(i),
      time,
      dateTime,
      amount,
      paymentMethod: method,
      bankStatus: isMissing ? "missing" : "matched",
      bankRef,
      bankAmount,
    });

    // Advance 1-5 minutes
    currentMinutes += 1 + Math.floor(Math.random() * 5);
  }

  return transactions;
}
