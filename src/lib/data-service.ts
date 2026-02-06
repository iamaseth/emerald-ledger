// Isolated data-fetching layer. Replace these functions with API calls to your backend.
// All functions return Promises to simulate async data fetching.

import {
  mockDailySales,
  mockBills,
  mockBankTransactions,
  mockAuditActions,
  mockMenuItems,
  mockInventoryItems,
  mockWasteLogs,
  mockStaffMembers,
  type DailySales,
  type Bill,
  type BankTransaction,
  type AuditAction,
  type MenuItem,
  type InventoryItem,
  type WasteLog,
  type StaffMember,
} from "./mock-data";

// Simulated delay
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchDailySales(): Promise<DailySales[]> {
  await delay(100);
  return mockDailySales;
}

export async function fetchBills(): Promise<Bill[]> {
  await delay(100);
  return mockBills;
}

export async function fetchBankTransactions(): Promise<BankTransaction[]> {
  await delay(100);
  return mockBankTransactions;
}

export async function fetchAuditActions(): Promise<AuditAction[]> {
  await delay(100);
  return mockAuditActions;
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  await delay(100);
  return mockMenuItems;
}

export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  await delay(100);
  return mockInventoryItems;
}

export async function fetchWasteLogs(): Promise<WasteLog[]> {
  await delay(100);
  return mockWasteLogs;
}

export async function fetchStaffMembers(): Promise<StaffMember[]> {
  await delay(100);
  return mockStaffMembers;
}

export function getKPIs() {
  const grossSales = mockBills.reduce((s, b) => s + b.total, 0);
  const vat = grossSales * 0.1;
  const serviceCharge = grossSales * 0.05;
  const netSales = grossSales - vat - serviceCharge;
  const totalLaborCost = mockStaffMembers.reduce((s, m) => s + m.hourlyCost * m.hoursWorked, 0);
  const laborCostPct = (totalLaborCost / grossSales) * 100;

  return { grossSales, netSales, vat, serviceCharge, laborCostPct };
}
