export interface DailySales {
  date: string;
  sales: number;
  deposits: number;
}

export interface Bill {
  id: string;
  date: string;
  time: string;
  table: string;
  items: number;
  total: number;
  paymentMethod: string;
  staff: string;
  status: "Matched" | "Mismatch" | "Unpaid" | "Ghost Payment";
  abaRef?: string;
}

export interface BankTransaction {
  id: string;
  ref: string;
  date: string;
  time: string;
  amount: number;
  sender: string;
  matchedBillId?: string;
}

export interface AuditAction {
  id: string;
  type: "Void" | "Bill Deletion" | "Manual Discount";
  staff: string;
  date: string;
  time: string;
  amount: number;
  reason: string;
  billId: string;
}

export interface MenuItem {
  id: string;
  name: string;
  nameKh: string;
  category: string;
  price: number;
  cost: number;
  margin: number;
  unitsSold: number;
  revenue: number;
  tag: "Best Seller" | "Low Margin" | "Standard";
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  unitCost: number;
  totalValue: number;
  lastRestocked: string;
}

export interface WasteLog {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: string;
  staff: string;
  date: string;
  cost: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  salesTotal: number;
  hoursWorked: number;
  salesPerHour: number;
  hourlyCost: number;
  attendance: number;
  rating: number;
}

// --- MOCK DATA ---

export const mockDailySales: DailySales[] = [
  { date: "Jan 27", sales: 4250, deposits: 3980 },
  { date: "Jan 28", sales: 5120, deposits: 5120 },
  { date: "Jan 29", sales: 3890, deposits: 3650 },
  { date: "Jan 30", sales: 6340, deposits: 6340 },
  { date: "Jan 31", sales: 7210, deposits: 6900 },
  { date: "Feb 01", sales: 8450, deposits: 8200 },
  { date: "Feb 02", sales: 9120, deposits: 9120 },
  { date: "Feb 03", sales: 5670, deposits: 5400 },
  { date: "Feb 04", sales: 6890, deposits: 6890 },
  { date: "Feb 05", sales: 7340, deposits: 7100 },
  { date: "Feb 06", sales: 8120, deposits: 7850 },
  { date: "Feb 07", sales: 4560, deposits: 4560 },
  { date: "Feb 08", sales: 9870, deposits: 9500 },
  { date: "Feb 09", sales: 6780, deposits: 6780 },
];

const staffNames = ["Sokha", "Dara", "Chanthol", "Reaksmey", "Bopha", "Virak", "Srey Neth"];

export const mockBills: Bill[] = [
  { id: "POS-20250206-001", date: "2025-02-06", time: "11:23", table: "T-04", items: 6, total: 48.50, paymentMethod: "ABA QR", staff: "Sokha", status: "Matched", abaRef: "ABA-QR-88401" },
  { id: "POS-20250206-002", date: "2025-02-06", time: "11:45", table: "T-07", items: 3, total: 27.00, paymentMethod: "Cash", staff: "Dara", status: "Unpaid" },
  { id: "POS-20250206-003", date: "2025-02-06", time: "12:10", table: "T-01", items: 8, total: 92.00, paymentMethod: "ABA QR", staff: "Chanthol", status: "Matched", abaRef: "ABA-QR-88403" },
  { id: "POS-20250206-004", date: "2025-02-06", time: "12:34", table: "T-12", items: 4, total: 35.50, paymentMethod: "ABA QR", staff: "Reaksmey", status: "Mismatch", abaRef: "ABA-QR-88404" },
  { id: "POS-20250206-005", date: "2025-02-06", time: "13:02", table: "T-09", items: 5, total: 63.00, paymentMethod: "ABA QR", staff: "Sokha", status: "Matched", abaRef: "ABA-QR-88405" },
  { id: "POS-20250206-006", date: "2025-02-06", time: "13:18", table: "T-02", items: 2, total: 18.00, paymentMethod: "Cash", staff: "Bopha", status: "Matched" },
  { id: "POS-20250206-007", date: "2025-02-06", time: "13:45", table: "T-06", items: 7, total: 84.00, paymentMethod: "ABA QR", staff: "Virak", status: "Matched", abaRef: "ABA-QR-88407" },
  { id: "POS-20250206-008", date: "2025-02-06", time: "14:12", table: "T-03", items: 3, total: 22.50, paymentMethod: "ABA QR", staff: "Srey Neth", status: "Ghost Payment", abaRef: "ABA-QR-88408" },
  { id: "POS-20250206-009", date: "2025-02-06", time: "14:30", table: "T-10", items: 9, total: 128.00, paymentMethod: "ABA QR", staff: "Dara", status: "Matched", abaRef: "ABA-QR-88409" },
  { id: "POS-20250206-010", date: "2025-02-06", time: "15:05", table: "T-05", items: 4, total: 42.00, paymentMethod: "Cash", staff: "Chanthol", status: "Matched" },
];

export const mockBankTransactions: BankTransaction[] = [
  { id: "TXN-001", ref: "ABA-QR-88401", date: "2025-02-06", time: "11:24", amount: 48.50, sender: "Chan Sovann", matchedBillId: "POS-20250206-001" },
  { id: "TXN-002", ref: "ABA-QR-88403", date: "2025-02-06", time: "12:11", amount: 92.00, sender: "Ly Sopheak", matchedBillId: "POS-20250206-003" },
  { id: "TXN-003", ref: "ABA-QR-88404", date: "2025-02-06", time: "12:35", amount: 33.00, sender: "Kim Hora", matchedBillId: "POS-20250206-004" },
  { id: "TXN-004", ref: "ABA-QR-88405", date: "2025-02-06", time: "13:03", amount: 63.00, sender: "Phan Rith", matchedBillId: "POS-20250206-005" },
  { id: "TXN-005", ref: "ABA-QR-88407", date: "2025-02-06", time: "13:46", amount: 84.00, sender: "Oun Maly", matchedBillId: "POS-20250206-007" },
  { id: "TXN-006", ref: "ABA-QR-88408", date: "2025-02-06", time: "14:12", amount: 22.50, sender: "Unknown", matchedBillId: "POS-20250206-008" },
  { id: "TXN-007", ref: "ABA-QR-88409", date: "2025-02-06", time: "14:31", amount: 128.00, sender: "Touch Leang", matchedBillId: "POS-20250206-009" },
  { id: "TXN-008", ref: "ABA-QR-88412", date: "2025-02-06", time: "16:00", amount: 55.00, sender: "Nhem Piseth" },
];

export const mockAuditActions: AuditAction[] = [
  { id: "AUD-001", type: "Void", staff: "Sokha", date: "2025-02-06", time: "12:45", amount: 12.00, reason: "Customer complaint — wrong order", billId: "POS-20250206-002" },
  { id: "AUD-002", type: "Manual Discount", staff: "Dara", date: "2025-02-06", time: "13:10", amount: 8.50, reason: "VIP guest — manager approved", billId: "POS-20250206-005" },
  { id: "AUD-003", type: "Bill Deletion", staff: "Virak", date: "2025-02-06", time: "14:22", amount: 35.00, reason: "Duplicate bill entry", billId: "POS-20250206-007" },
  { id: "AUD-004", type: "Void", staff: "Chanthol", date: "2025-02-06", time: "15:30", amount: 6.00, reason: "Item unavailable", billId: "POS-20250206-009" },
  { id: "AUD-005", type: "Manual Discount", staff: "Reaksmey", date: "2025-02-06", time: "16:15", amount: 15.00, reason: "Birthday promotion — 20% off", billId: "POS-20250206-010" },
  { id: "AUD-006", type: "Bill Deletion", staff: "Sokha", date: "2025-02-05", time: "19:40", amount: 22.00, reason: "Test order — training", billId: "POS-20250205-018" },
  { id: "AUD-007", type: "Void", staff: "Bopha", date: "2025-02-05", time: "20:10", amount: 9.50, reason: "Spilled drink — remade", billId: "POS-20250205-021" },
];

export const mockMenuItems: MenuItem[] = [
  { id: "M-001", name: "Lok Lak", nameKh: "ឡុកឡាក់", category: "Main Course", price: 8.50, cost: 3.20, margin: 62, unitsSold: 145, revenue: 1232.50, tag: "Best Seller" },
  { id: "M-002", name: "Fish Amok", nameKh: "អាម៉ុក", category: "Main Course", price: 9.00, cost: 3.80, margin: 58, unitsSold: 112, revenue: 1008.00, tag: "Best Seller" },
  { id: "M-003", name: "Beef Stir-Fry", nameKh: "ឆាសាច់គោ", category: "Main Course", price: 7.50, cost: 4.10, margin: 45, unitsSold: 89, revenue: 667.50, tag: "Standard" },
  { id: "M-004", name: "Spring Rolls", nameKh: "ន៎ំចៀន", category: "Appetizer", price: 4.00, cost: 1.20, margin: 70, unitsSold: 198, revenue: 792.00, tag: "Best Seller" },
  { id: "M-005", name: "Wagyu Steak", nameKh: "សាច់គោវ៉ាហ្គូ", category: "Premium", price: 28.00, cost: 22.00, margin: 21, unitsSold: 12, revenue: 336.00, tag: "Low Margin" },
  { id: "M-006", name: "Imported Wine Glass", nameKh: "ស្រាបារាំង", category: "Beverage", price: 12.00, cost: 8.50, margin: 29, unitsSold: 34, revenue: 408.00, tag: "Low Margin" },
  { id: "M-007", name: "Iced Coffee", nameKh: "កាហ្វេទឹកកក", category: "Beverage", price: 3.00, cost: 0.60, margin: 80, unitsSold: 320, revenue: 960.00, tag: "Best Seller" },
  { id: "M-008", name: "Green Mango Salad", nameKh: "ញាំស្វាយ", category: "Appetizer", price: 5.00, cost: 1.80, margin: 64, unitsSold: 76, revenue: 380.00, tag: "Standard" },
  { id: "M-009", name: "Prahok Ktis", nameKh: "ប្រហុកខ្ទិះ", category: "Main Course", price: 6.50, cost: 2.40, margin: 63, unitsSold: 95, revenue: 617.50, tag: "Standard" },
  { id: "M-010", name: "Lobster Tail", nameKh: "បង្គាធំ", category: "Premium", price: 35.00, cost: 28.00, margin: 20, unitsSold: 8, revenue: 280.00, tag: "Low Margin" },
];

export const mockInventoryItems: InventoryItem[] = [
  { id: "INV-001", name: "Hennessy VS", category: "Liquor", unit: "Bottle", currentStock: 8, minStock: 5, unitCost: 45.00, totalValue: 360.00, lastRestocked: "2025-02-01" },
  { id: "INV-002", name: "Johnnie Walker Black", category: "Liquor", unit: "Bottle", currentStock: 3, minStock: 5, unitCost: 38.00, totalValue: 114.00, lastRestocked: "2025-01-28" },
  { id: "INV-003", name: "Australian Wagyu Striploin", category: "Premium Meat", unit: "kg", currentStock: 4.5, minStock: 3, unitCost: 65.00, totalValue: 292.50, lastRestocked: "2025-02-04" },
  { id: "INV-004", name: "Tiger Prawns", category: "Seafood", unit: "kg", currentStock: 2.0, minStock: 5, unitCost: 22.00, totalValue: 44.00, lastRestocked: "2025-02-05" },
  { id: "INV-005", name: "Siem Reap Craft Beer", category: "Beverage", unit: "Case", currentStock: 12, minStock: 8, unitCost: 18.00, totalValue: 216.00, lastRestocked: "2025-02-03" },
  { id: "INV-006", name: "Imported Olive Oil", category: "Pantry", unit: "Bottle", currentStock: 6, minStock: 4, unitCost: 12.00, totalValue: 72.00, lastRestocked: "2025-02-02" },
  { id: "INV-007", name: "Fresh Lobster", category: "Seafood", unit: "kg", currentStock: 1.5, minStock: 3, unitCost: 55.00, totalValue: 82.50, lastRestocked: "2025-02-05" },
];

export const mockWasteLogs: WasteLog[] = [
  { id: "W-001", itemName: "Tiger Prawns", quantity: 0.5, unit: "kg", reason: "Expired — exceeded shelf life", staff: "Chanthol", date: "2025-02-06", cost: 11.00 },
  { id: "W-002", itemName: "Siem Reap Craft Beer", quantity: 2, unit: "Bottle", reason: "Dropped during service", staff: "Bopha", date: "2025-02-05", cost: 6.00 },
  { id: "W-003", itemName: "Australian Wagyu Striploin", quantity: 0.3, unit: "kg", reason: "Over-trimmed", staff: "Sokha", date: "2025-02-06", cost: 19.50 },
];

export const mockStaffMembers: StaffMember[] = [
  { id: "S-001", name: "Sokha", role: "Senior Server", salesTotal: 1840, hoursWorked: 42, salesPerHour: 43.81, hourlyCost: 4.50, attendance: 98, rating: 4.8 },
  { id: "S-002", name: "Dara", role: "Server", salesTotal: 1520, hoursWorked: 40, salesPerHour: 38.00, hourlyCost: 3.50, attendance: 95, rating: 4.5 },
  { id: "S-003", name: "Chanthol", role: "Head Chef", salesTotal: 0, hoursWorked: 48, salesPerHour: 0, hourlyCost: 6.00, attendance: 100, rating: 4.9 },
  { id: "S-004", name: "Reaksmey", role: "Server", salesTotal: 1380, hoursWorked: 38, salesPerHour: 36.32, hourlyCost: 3.50, attendance: 92, rating: 4.3 },
  { id: "S-005", name: "Bopha", role: "Bartender", salesTotal: 960, hoursWorked: 36, salesPerHour: 26.67, hourlyCost: 4.00, attendance: 88, rating: 4.1 },
  { id: "S-006", name: "Virak", role: "Server", salesTotal: 1650, hoursWorked: 44, salesPerHour: 37.50, hourlyCost: 3.50, attendance: 96, rating: 4.6 },
  { id: "S-007", name: "Srey Neth", role: "Hostess", salesTotal: 420, hoursWorked: 35, salesPerHour: 12.00, hourlyCost: 3.00, attendance: 100, rating: 4.7 },
];
