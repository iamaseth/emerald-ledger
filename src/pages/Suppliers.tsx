import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Building2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const SUPPLIER_CATEGORIES = ["Food", "Liquor", "Beer", "Wine", "Chemicals", "Supplies", "Equipment", "Utilities", "Services", "Other"];

export interface Supplier {
  id: string;
  name: string;
  tin: string;
  contactPerson: string;
  phone: string;
  category: string;
  notes: string;
}

const initialSuppliers: Supplier[] = [
  { id: "1", name: "Phnom Penh Beer Co.", tin: "K001-234567", contactPerson: "Sok Heng", phone: "012-345-678", category: "Beer", notes: "Main beer distributor" },
  { id: "2", name: "Cambodia Spirits Ltd", tin: "K002-876543", contactPerson: "Chan Dara", phone: "011-987-654", category: "Liquor", notes: "Premium spirits" },
  { id: "3", name: "Fresh Market PP", tin: "K003-112233", contactPerson: "Kim Ly", phone: "010-111-222", category: "Food", notes: "Daily kitchen supplies" },
  { id: "4", name: "CleanPro Cambodia", tin: "K004-445566", contactPerson: "Mao Rina", phone: "015-333-444", category: "Chemicals", notes: "Cleaning supplies" },
  { id: "5", name: "EDC", tin: "K005-778899", contactPerson: "Service Dept", phone: "023-123-456", category: "Utilities", notes: "Electricity" },
];

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [tin, setTin] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("Food");
  const [notes, setNotes] = useState("");

  const filtered = useMemo(() => {
    let list = suppliers;
    if (catFilter !== "All") list = list.filter((s) => s.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q) || s.tin.toLowerCase().includes(q));
    }
    return list;
  }, [suppliers, search, catFilter]);

  function resetForm() {
    setName(""); setTin(""); setContactPerson(""); setPhone(""); setCategory("Food"); setNotes(""); setEditId(null);
  }

  function handleSubmit() {
    if (!name.trim()) { toast({ title: "Supplier name is required", variant: "destructive" }); return; }
    if (editId) {
      setSuppliers((prev) => prev.map((s) => s.id === editId ? { ...s, name: name.trim(), tin: tin.trim(), contactPerson: contactPerson.trim(), phone: phone.trim(), category, notes: notes.trim() } : s));
      toast({ title: "Supplier updated" });
    } else {
      setSuppliers((prev) => [...prev, { id: Date.now().toString(), name: name.trim(), tin: tin.trim(), contactPerson: contactPerson.trim(), phone: phone.trim(), category, notes: notes.trim() }]);
      toast({ title: "Supplier added" });
    }
    resetForm();
    setShowForm(false);
  }

  function openEdit(s: Supplier) {
    setEditId(s.id); setName(s.name); setTin(s.tin); setContactPerson(s.contactPerson);
    setPhone(s.phone); setCategory(s.category); setNotes(s.notes); setShowForm(true);
  }

  function deleteSupplier(id: string) {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Supplier deleted" });
  }

  const categories = useMemo(() => [...new Set(suppliers.map((s) => s.category))].sort(), [suppliers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Supplier Directory</h1>
          <p className="text-sm text-muted-foreground">Manage vendor data & TIN records</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, contact, or TIN..." className="pl-9 bg-secondary border-border" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="All">All Categories</SelectItem>
            {SUPPLIER_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Suppliers</span>
            </div>
            <p className="text-lg font-bold text-foreground">{suppliers.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Categories</p>
            <p className="text-lg font-bold text-foreground">{categories.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">With TIN</p>
            <p className="text-lg font-bold text-success">{suppliers.filter((s) => s.tin.trim()).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground text-xs">Supplier Name</TableHead>
                <TableHead className="text-muted-foreground text-xs">TIN</TableHead>
                <TableHead className="text-muted-foreground text-xs">Contact Person</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">Phone</TableHead>
                <TableHead className="text-muted-foreground text-xs">Category</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No suppliers found.</TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id} className="border-border hover:bg-secondary/40">
                    <TableCell className="text-sm font-medium text-foreground">{s.name}</TableCell>
                    <TableCell className="text-xs font-mono text-primary">{s.tin || "—"}</TableCell>
                    <TableCell className="text-xs text-foreground">{s.contactPerson || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{s.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] bg-secondary text-muted-foreground border-border">{s.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteSupplier(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { resetForm(); setShowForm(false); } }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editId ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Supplier Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" />
            </div>
            <div className="space-y-1.5">
              <Label>TIN (Tax ID)</Label>
              <Input value={tin} onChange={(e) => setTin(e.target.value)} placeholder="K001-234567" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contact Person</Label>
                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Name" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="012-345-678" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {SUPPLIER_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? "Update" : "Add Supplier"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
