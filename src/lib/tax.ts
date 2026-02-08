// Cambodian Tax Engine
// VAT: 10% on all taxable goods/services
// PLT: Public Lighting Tax — 3% on Alcohol & Tobacco categories

export const VAT_RATE = 0.10;
export const PLT_RATE = 0.03;

/** Categories subject to PLT (Public Lighting Tax) */
const PLT_CATEGORIES = new Set(["Beverage", "Liquor", "Alcohol", "Tobacco"]);

/** Calculate VAT amount from a base price */
export function calcVAT(amount: number): number {
  return Math.round(amount * VAT_RATE * 100) / 100;
}

/** Calculate PLT amount from a base price */
export function calcPLT(amount: number): number {
  return Math.round(amount * PLT_RATE * 100) / 100;
}

/** Check if a category is subject to PLT */
export function isPLTApplicable(category: string): boolean {
  return PLT_CATEGORIES.has(category);
}

/** Calculate full tax breakdown for a line item */
export function calcTaxBreakdown(
  amount: number,
  applyVAT: boolean,
  applyPLT: boolean
): { vat: number; plt: number; total: number; grandTotal: number } {
  const vat = applyVAT ? calcVAT(amount) : 0;
  const plt = applyPLT ? calcPLT(amount) : 0;
  const total = vat + plt;
  return { vat, plt, total, grandTotal: amount + total };
}

/** Format USD amount */
export function fmtUSD(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
