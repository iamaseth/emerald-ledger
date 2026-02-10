import { useState, useMemo } from "react";
import { format, differenceInDays, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Plus, DollarSign, AlertTriangle, Clock, CheckCircle, CreditCard, Pencil, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useAccountsPayable, type APInvoice } from "@/hooks/useAccountsPayable";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = ["Food", "Liquor", "Beer", "Wine", "Supplies", "Equipment", "Rent", "Utilities", "Marketing", "Other"];
const PAYMENT_TERMS = ["COD", "Net 7", "Net 15", "Net 30", "Net 60", "Net 90"];
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Check", "Credit Card"];
const STATUS_FILTERS = ["All", "Unpaid", "Partial", "Paid", "Overdue"];

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DatePickerField({ label, value, onChange }: { label: string; value: Date | undefined; onChange: (d: Date | undefined) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function AccountsPayable() {
  const { invoices, addInvoice, recordPayment, updateInvoice, deleteInvoice } = useAccountsPayable();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [vendor, setVendor] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [totalAmount, setTotalAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [notes, setNotes] = useState("");

  // Payment modal
  const [payInvoice, setPayInvoice] = useState<APInvoice | null>(null);
  const [payDate, setPayDate] = useState<Date | undefined>(new Date());
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Bank Transfer");
  const [payNotes, setPayNotes] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  const today = new Date();

  // Computed
  const uniqueVendors = useMemo(() => [...new Set(invoices.map((i) => i.vendor))].sort(), [invoices]);

  const vendorSummary = useMemo(() => {
    const map: Record<string, { total: number; outstanding: number; count: number }> = {};
    invoices.forEach((inv) => {
      if (!map[inv.vendor]) map[inv.vendor] = { total: 0, outstanding: 0, count: 0 };
      map[inv.vendor].total += inv.totalAmount;
      map[inv.vendor].outstanding += inv.balanceDue;
      map[inv.vendor].count += 1;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [invoices]);

  const filtered = useMemo(() => {
    let list = [...invoices];
    const activeVendor = selectedVendor || (vendorFilter !== "All" ? vendorFilter : null);

    if (activeVendor) list = list.filter((i) => i.vendor === activeVendor);
    if (categoryFilter !== "All") list = list.filter((i) => i.category === categoryFilter);

    if (statusFilter === "Overdue") {
      list = list.filter((i) => i.status !== "Paid" && parseISO(i.dueDate) < today);
    } else if (statusFilter !== "All") {
      list = list.filter((i) => i.status === statusFilter);
    }

    return list.sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
  }, [invoices, statusFilter, vendorFilter, categoryFilter, selectedVendor]);

  const totalOutstanding = useMemo(() => invoices.reduce((s, i) => s + i.balanceDue, 0), [invoices]);
  const overdueAmount = useMemo(
    () => invoices.filter((i) => i.status !== "Paid" && parseISO(i.dueDate) < today).reduce((s, i) => s + i.balanceDue, 0),
    [invoices]
  );
  const dueThisWeek = useMemo(() => {
    const ws = startOfWeek(today, { weekStartsOn: 1 });
    const we = endOfWeek(today, { weekStartsOn: 1 });
    return invoices
      .filter((i) => i.status !== "Paid" && isWithinInterval(parseISO(i.dueDate), { start: ws, end: we }))
      .reduce((s, i) => s + i.balanceDue, 0);
  }, [invoices]);
  const paidThisMonth = useMemo(() => {
    const ms = startOfMonth(today);
    const me = endOfMonth(today);
    return invoices.reduce(
      (s, i) => s + i.payments.filter((p) => isWithinInterval(parseISO(p.date), { start: ms, end: me })).reduce((ps, p) => ps + p.amount, 0),
      0
    );
  }, [invoices]);

  function resetForm() {
    setVendor(""); setInvoiceNumber(""); setInvoiceDate(new Date()); setDueDate(undefined);
    setTotalAmount(""); setCategory("Food"); setPaymentTerms("Net 30"); setNotes(""); setEditId(null);
  }

  function handleSubmit() {
    if (!vendor.trim() || !invoiceNumber.trim() || !invoiceDate || !dueDate || !totalAmount) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    const amt = parseFloat(totalAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    if (editId) {
      updateInvoice(editId, {
        vendor: vendor.trim(), invoiceNumber: invoiceNumber.trim(),
        invoiceDate: format(invoiceDate, "yyyy-MM-dd"), dueDate: format(dueDate, "yyyy-MM-dd"),
        totalAmount: amt, category, paymentTerms, notes: notes.trim(),
      });
      toast({ title: "Invoice updated" });
    } else {
      addInvoice({
        vendor: vendor.trim(), invoiceNumber: invoiceNumber.trim(),
        invoiceDate: format(invoiceDate, "yyyy-MM-dd"), dueDate: format(dueDate, "yyyy-MM-dd"),
        totalAmount: amt, category, paymentTerms, notes: notes.trim(),
      });
      toast({ title: "Invoice added" });
    }
    resetForm();
    setShowForm(false);
  }

  function openEdit(inv: APInvoice) {
    setEditId(inv.id); setVendor(inv.vendor); setInvoiceNumber(inv.invoiceNumber);
    setInvoiceDate(parseISO(inv.invoiceDate)); setDueDate(parseISO(inv.dueDate));
    setTotalAmount(String(inv.totalAmount)); setCategory(inv.category);
    setPaymentTerms(inv.paymentTerms); setNotes(inv.notes); setShowForm(true);
  }

  function handlePayment() {
    if (!payInvoice || !payDate || !payAmount) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0 || amt > payInvoice.balanceDue) {
      toast({ title: "Invalid payment amount", description: `Max: $${fmt(payInvoice.balanceDue)}`, variant: "destructive" });
      return;
    }
    recordPayment(payInvoice.id, {
      date: format(payDate, "yyyy-MM-dd"), amount: amt, method: payMethod, notes: payNotes.trim(),
    });
    toast({ title: "Payment recorded", description: `$${fmt(amt)} paid to ${payInvoice.vendor}` });
    setPayInvoice(null); setPayAmount(""); setPayNotes("");
  }

  function daysOverdue(dueDate: string) {
    const diff = differenceInDays(today, parseISO(dueDate));
    return diff > 0 ? diff : 0;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounts Payable</h1>
          <p className="text-sm text-muted-foreground">Track vendor debts and credit purchases</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Total Outstanding</span>
            </div>
            <p className="text-2xl font-bold text-destructive">${fmt(totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">${fmt(overdueAmount)}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Due This Week</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">${fmt(dueThisWeek)}</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Paid This Month</span>
            </div>
            <p className="text-2xl font-bold text-green-600">${fmt(paidThisMonth)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Summary */}
      {vendorSummary.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Vendor Summary</h3>
            <div className="flex flex-wrap gap-2">
              {vendorSummary.map((v) => (
                <button
                  key={v.name}
                  onClick={() => setSelectedVendor(selectedVendor === v.name ? null : v.name)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    selectedVendor === v.name
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  )}
                >
                  {v.name}
                  <span className={cn("font-bold", v.outstanding > 0 ? "text-destructive" : "text-green-600")}>
                    ${fmt(v.outstanding)}
                  </span>
                  <span className="text-muted-foreground">({v.count})</span>
                </button>
              ))}
              {selectedVendor && (
                <button onClick={() => setSelectedVendor(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
            {s}
          </Button>
        ))}
        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Vendor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Vendors</SelectItem>
            {uniqueVendors.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead className="hidden md:table-cell">Inv. Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Overdue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No invoices found. Click "Add Invoice" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inv) => {
                  const overdue = inv.status !== "Paid" && daysOverdue(inv.dueDate) > 0;
                  return (
                    <TableRow key={inv.id} className={cn(overdue && "bg-destructive/5")}>
                      <TableCell className="font-medium">{inv.vendor}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.invoiceNumber}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{format(parseISO(inv.invoiceDate), "dd MMM")}</TableCell>
                      <TableCell className={cn(overdue && "text-destructive font-medium")}>{format(parseISO(inv.dueDate), "dd MMM yy")}</TableCell>
                      <TableCell className="text-right">${fmt(inv.totalAmount)}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell">${fmt(inv.amountPaid)}</TableCell>
                      <TableCell className="text-right font-semibold">${fmt(inv.balanceDue)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === "Paid" ? "default" : inv.status === "Partial" ? "secondary" : "destructive"}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {overdue ? <span className="text-destructive font-medium">{daysOverdue(inv.dueDate)}d</span> : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inv.status !== "Paid" && (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setPayInvoice(inv); setPayAmount(""); setPayNotes(""); setPayDate(new Date()); setPayMethod("Bank Transfer"); }}>
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(inv)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { deleteInvoice(inv.id); toast({ title: "Invoice deleted" }); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Invoice Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { resetForm(); setShowForm(false); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Invoice" : "Add Invoice"}</DialogTitle>
            <DialogDescription>Enter vendor invoice details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vendor Name *</Label>
                <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. SOK THARY" />
              </div>
              <div className="space-y-1.5">
                <Label>Invoice Number *</Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="e.g. LSH-001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DatePickerField label="Invoice Date *" value={invoiceDate} onChange={setInvoiceDate} />
              <DatePickerField label="Due Date *" value={dueDate} onChange={setDueDate} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Total Amount ($) *</Label>
                <Input type="number" min="0" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? "Update" : "Add Invoice"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={!!payInvoice} onOpenChange={(o) => { if (!o) setPayInvoice(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {payInvoice && `${payInvoice.vendor} — ${payInvoice.invoiceNumber} • Balance: $${fmt(payInvoice.balanceDue)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <DatePickerField label="Payment Date" value={payDate} onChange={setPayDate} />
            <div className="space-y-1.5">
              <Label>Amount ($)</Label>
              <Input type="number" min="0" step="0.01" max={payInvoice?.balanceDue} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Optional..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayInvoice(null)}>Cancel</Button>
            <Button onClick={handlePayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
