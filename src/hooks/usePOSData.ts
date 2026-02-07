import { useState, useEffect } from "react";
import type {
  DailySales,
  Bill,
  BankTransaction,
  AuditAction,
  MenuItem,
  InventoryItem,
  WasteLog,
  StaffMember,
} from "@/lib/mock-data";

// ============================================================
// TODO: Replace this with your production API base URL, e.g.:
// const API_BASE_URL = "https://your-server.com/api";
// ============================================================
const API_BASE_URL = null; // Set to null to use local mock data

async function fetchFromAPI<T>(endpoint: string, fallbackData: T): Promise<T> {
  if (!API_BASE_URL) {
    // Using local mock JSON while no backend is configured
    return fallbackData;
  }

  // TODO: Replace with real fetch call when API_BASE_URL is set
  // const response = await fetch(`${API_BASE_URL}/${endpoint}`);
  // if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
  // return response.json();
  return fallbackData;
}

interface POSData {
  dailySales: DailySales[];
  bills: Bill[];
  bankTransactions: BankTransaction[];
  auditActions: AuditAction[];
  menuItems: MenuItem[];
  inventoryItems: InventoryItem[];
  wasteLogs: WasteLog[];
  staffMembers: StaffMember[];
}

export function usePOSData() {
  const [data, setData] = useState<POSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Import mock JSON as fallback data source
        const mock = await import("@/mock-data.json");

        const [
          dailySales,
          bills,
          bankTransactions,
          auditActions,
          menuItems,
          inventoryItems,
          wasteLogs,
          staffMembers,
        ] = await Promise.all([
          // TODO: Each endpoint string maps to your REST API route, e.g. "daily-sales"
          fetchFromAPI<DailySales[]>("daily-sales", mock.daily_sales),
          fetchFromAPI<Bill[]>("bills", mock.bills as Bill[]),
          fetchFromAPI<BankTransaction[]>("bank-transactions", mock.bank_transactions as BankTransaction[]),
          fetchFromAPI<AuditAction[]>("audit-actions", mock.audit_actions as AuditAction[]),
          fetchFromAPI<MenuItem[]>("menu-items", mock.menu_items as MenuItem[]),
          fetchFromAPI<InventoryItem[]>("inventory-items", mock.inventory_items as InventoryItem[]),
          fetchFromAPI<WasteLog[]>("waste-logs", mock.waste_logs as WasteLog[]),
          fetchFromAPI<StaffMember[]>("staff-members", mock.staff_members as StaffMember[]),
        ]);

        if (!cancelled) {
          setData({ dailySales, bills, bankTransactions, auditActions, menuItems, inventoryItems, wasteLogs, staffMembers });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
