import { useState, useEffect, useCallback } from "react";

export interface Payment {
  date: string;
  amount: number;
  method: string;
  notes: string;
}

export interface APInvoice {
  id: string;
  vendor: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: "Unpaid" | "Partial" | "Paid";
  category: string;
  paymentTerms: string;
  notes: string;
  payments: Payment[];
  createdAt: string;
}

const STORAGE_KEY = "accountsPayable";

function loadFromStorage(): APInvoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(data: APInvoice[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let nextId = 1;

function generateId(): string {
  const existing = loadFromStorage();
  const maxNum = existing.reduce((max, inv) => {
    const num = parseInt(inv.id.replace("AP", ""), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  nextId = maxNum + 1;
  return `AP${String(nextId).padStart(3, "0")}`;
}

export function useAccountsPayable() {
  const [invoices, setInvoices] = useState<APInvoice[]>(loadFromStorage);

  useEffect(() => {
    saveToStorage(invoices);
  }, [invoices]);

  const addInvoice = useCallback(
    (data: Omit<APInvoice, "id" | "amountPaid" | "balanceDue" | "status" | "payments" | "createdAt">) => {
      const inv: APInvoice = {
        ...data,
        id: generateId(),
        amountPaid: 0,
        balanceDue: data.totalAmount,
        status: "Unpaid",
        payments: [],
        createdAt: new Date().toISOString(),
      };
      setInvoices((prev) => [...prev, inv]);
    },
    []
  );

  const recordPayment = useCallback(
    (invoiceId: string, payment: Payment) => {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== invoiceId) return inv;
          const newPaid = inv.amountPaid + payment.amount;
          const newBalance = Math.max(0, inv.totalAmount - newPaid);
          const newStatus: APInvoice["status"] =
            newBalance <= 0 ? "Paid" : newPaid > 0 ? "Partial" : "Unpaid";
          return {
            ...inv,
            amountPaid: newPaid,
            balanceDue: newBalance,
            status: newStatus,
            payments: [...inv.payments, payment],
          };
        })
      );
    },
    []
  );

  const updateInvoice = useCallback(
    (invoiceId: string, data: Partial<Omit<APInvoice, "id" | "payments" | "createdAt">>) => {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, ...data } : inv))
      );
    },
    []
  );

  const deleteInvoice = useCallback((invoiceId: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
  }, []);

  return { invoices, addInvoice, recordPayment, updateInvoice, deleteInvoice };
}
