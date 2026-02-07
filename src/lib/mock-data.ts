// Type definitions and data re-exports from the central JSON file.
// When migrating to a backend, replace the JSON import with API calls in data-service.ts.

import jsonData from "@/mock-data.json";

// ---------- Type Definitions ----------

export interface DailySales {
  date: string;
  sales: number;
  deposits: number;
}

export interface Bill {
  bill_id: string;
  date: string;
  timestamp: string;
  table: string;
  items: number;
  grand_total: number;
  payment_mode: string;
  staff_name: string;
  aba_status: "Matched" | "Mismatch" | "Unpaid" | "Ghost Payment";
  aba_ref?: string;
}

export interface BankTransaction {
  id: string;
  ref: string;
  date: string;
  timestamp: string;
  amount: number;
  sender: string;
  matched_bill_id?: string;
}

export interface AuditAction {
  id: string;
  type: "Void" | "Bill Deletion" | "Manual Discount";
  staff_name: string;
  date: string;
  timestamp: string;
  amount: number;
  reason: string;
  bill_id: string;
}

export interface MenuItem {
  id: string;
  name: string;
  name_kh: string;
  category: string;
  price: number;
  cost: number;
  margin: number;
  units_sold: number;
  revenue: number;
  tag: "Best Seller" | "Low Margin" | "Standard";
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  unit_cost: number;
  total_value: number;
  last_restocked: string;
}

export interface WasteLog {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  reason: string;
  staff_name: string;
  date: string;
  cost: number;
}

export interface StaffMember {
  id: string;
  staff_name: string;
  role: string;
  sales_total: number;
  hours_worked: number;
  sales_per_hour: number;
  hourly_cost: number;
  attendance: number;
  rating: number;
}

// ---------- Data Exports ----------

export const mockDailySales: DailySales[] = jsonData.daily_sales;
export const mockBills: Bill[] = jsonData.bills as Bill[];
export const mockBankTransactions: BankTransaction[] = jsonData.bank_transactions as BankTransaction[];
export const mockAuditActions: AuditAction[] = jsonData.audit_actions as AuditAction[];
export const mockMenuItems: MenuItem[] = jsonData.menu_items as MenuItem[];
export const mockInventoryItems: InventoryItem[] = jsonData.inventory_items as InventoryItem[];
export const mockWasteLogs: WasteLog[] = jsonData.waste_logs as WasteLog[];
export const mockStaffMembers: StaffMember[] = jsonData.staff_members as StaffMember[];
